(function($){
  var exports = window.sitations = {},
      AH = 'annoHash',
      console = window.console || { log:function(){} },
      LUT = {},
      annotations = [];

  exports.annotations = annotations; //XXX for testing

  ///////
  /// NODE IDENTIFICATION & MATCHING

  exports.hash_node = function hash_node(x) {
    var ret = $.data(x, AH), html, i, ii, ix;
    if (ret) {  return ret; }
    html = $(x).html().replace(/\W/g,'');
    ret = 0 - (-1 >>> 1);
    ret += parseInt(html.substr(0,10), 36) || 0;
    ret += parseInt(html.substr(Math.max(html.length - 11, 0)), 36) || 0;
    for (i = 0, ii = html.length, ix = (~~(html.length / 10) || 1); i < ii; i += ix) {
      ret += parseInt(html[i], 36) || 0;
    }
    ret += html.length;
    return ret;
  };

  function matches_path(n, pathstr) {
    var res;
    res = $(pathstr).filter(function(){ return $.data(this, AH) == n; });
    if (res[0]) {
      return res[0];
    }
    return null;
  }

  exports.get_node = function get_node(n, pathstr) {
    var res = LUT[n],
        path, working;
    if (!pathstr || !res || !res.push) {
      return res;
    } else {
      if($(pathstr).data(AH) == n) {
        return $(pathstr)[0];
      }
      path = pathstr.split('>');
      working = pathstr;
      while(path.length > 0) {
        res = matches_path(n, working);
        if (res[0]) { return res[0]; }
        res = matches_path(n, working.substr(0, working.indexOf(/:nth\(\d+\)$/)));
        if (res[0]) { return res[0]; }
        path.pop();
        working = path.join('>');
      }
      return $(pathstr)[0] || LUT[n][0]; //XXX not sure about this
    }
  };

  exports.path_node = function path_node(x) {
    var path = [];
    $(x).parentsUntil('body').andSelf().each(function(i, el){
      var str = el.nodeName.toLowerCase(),
          id = el.id || '',
          cls = (el.className || '').replace(/\s+/g,'.'),
          nth = '';

      str += id ? id = '#' + id : '';
      str += cls ? cls = '.' + cls : '';

      nth = $(el).prevAll(str).length;
      if (nth > 0 ) { str += ':nth('+ nth +')'; }
      path.push(str);
    });
    //the .andSelf() puts the self on the wrong end
    //path.push(path.shift());
    return path.join('>');
  };

  ///////
  /// EVENT HANDLING

  function place_pin(id, target, pageX, pageY) {
    target = $(target);
    if(typeof id == 'string'){ id = ~~(id.substr(3)); }
    var cushion = $('#sN_'+id),
        sidebar = $('#sN_s'+id),
        offset = target.offset(),
        anchor = { x: pageX - offset.left, y: pageY - offset.top },
        bounds = $.extend({}, anchor),
        citation;
    //console.log(id, cushion, target);
    cushion.css({top: anchor.y - 8, left: anchor.x - 8, position: 'absolute'}).appendTo(target);
    target.css('position', target.css('position').replace('static','relative'));
    citation = {
      path : exports.path_node(target),
      hash : exports.hash_node(target),
      text : cushion.find("textarea").val(),
      anchor : {
        x: anchor.x,
        y: anchor.y
      },
      bounds : {
        x: bounds.x,
        y: bounds.y
      },
      // on page helpfulness
      cushion : target,
      sidebar : sidebar,
      id : id
    };
    annotations[id] = citation;
    $(document.body).trigger('place.pin',[citation]);
  }

  function do_add(e){
    var cushion = template_pin(document.body),
        id = annotations.length;

    cushion.attr('id','sN_'+id)
           .find('.sN_pin>span').text(id + 1);

    function pin_move(e){ cushion.css({ top: e.pageY - 8, left: e.pageX - 8 }); }

    $(window).mousemove(pin_move);
    cushion.one('click', function(e){
      console.log('unbind')
      $(window).unbind("mousemove", pin_move);

      //get the element underneath the pin
      cushion.toggleClass('sN_hidden');
      var target = document.elementFromPoint(e.pageX, e.pageY);
      cushion.toggleClass('sN_hidden');

      cushion.data('placed', true);
      cushion.find('.sN_pin').css('cursor','move');

      //place pin
      place_pin(cushion.attr('id'), target, e.pageX, e.pageY);
    });
  }

  // pin click -> edit text
  $('.sN_pin').live('mouseup', function(e){
      var cushion = $(e.target).parents('.sN_pin_cushion');
      cushion.find('.sN_annotation').removeClass('sN_hidden');
      cushion.find('textarea').autogrow();
      setTimeout(function(){cushion.find('textarea').focus();}, 0); //if we don't timeout it, this screws up when we reparent the cushion
  });

  // Drag & Drop pin
  $('.sN_pin').live('mousedown', function(e){
    var cushion = $(e.target).parents('.sN_pin_cushion'),
        loc = {x: e.pageX, y: e.pageY},
        moved = false;
    if (!cushion.data('placed')) {return;}
    function pin_move(e){
      var offset;
      if (moved || Math.max(loc.x - e.pageX, loc.y - e.pageY) > 10){
        moved = true;
        if (!offset) {offset = cushion.parent().offset()}
        cushion.css({ top: e.pageY - offset.top - 8, left: e.pageX - offset.left - 8 });
      }
    }
    $(window).mousemove(pin_move);
    $(window).one("mouseup", function (e) {
      $(window).unbind("mousemove", pin_move);

      if(moved) {
        //get the element underneath the pin
        cushion.toggleClass('sN_hidden');
        var target = document.elementFromPoint(e.pageX, e.pageY);
        cushion.toggleClass('sN_hidden');

        //place pin
        place_pin(cushion.attr('id'), target, e.pageX, e.pageY);
      }
    });
  });
  $('.sN_annotation>textarea').live('blur', function(e){
    var id = ~~($(e.target).parents('.sN_pin_cushion').attr('id').substr(3)),
        citation = annotations[id];

    if(!citation) return;

    $(e.target).parent('.sN_annotation').addClass('sN_hidden');
    citation.text = e.target.value || '';
    $(document.body).trigger('text.pin', [citation]);
  });

  function halt(e){
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  function update_sidebar_item(e, citation) {
    console.log('citation', citation);
    elem = citation.sidebar;
    if(!elem || elem.length == 0){
      citation.sidebar = template_sidebar_item().appendTo($('#sN_sidebar'));
      elem = citation.sidebar;
    }
    elem.attr('id', 'sN_s'+citation.id);
    elem.find('.sN_num').text(citation.id + 1);
    elem.find('.sN_text').text(citation.text);
  }
  function update_side_count(){
    $('#sN_side_count').text(annotations.length)[(annotations.length ? 'add' : 'remove')+'Class']('sN_has_citations');
  }

  $(document.body).bind('place.pin', update_side_count);
  $(document.body).bind('clear.pin', update_side_count);

  //$(document.body).bind('place.pin', update_sidebar_item);
  $(document.body).bind('text.pin', update_sidebar_item);
  $(document.body).bind('clear.pin', function(){
    $('#sN_sidebar').empty().addClass('sN_hidden');
    $('#sN_side_count').removeClass('sN_side_closer');
  });

  $(".sN_pin_cushion, .sN_menu, .sN_sidebar_wrap").live('click', halt);

  //Action button handlers
  $('#sN_menu>.sN_button:not(#sN_toggle)').live('click',function(){
    $(document.documentElement).removeClass('pins_hidden');
  })
  $('#sN_add').live('click', do_add);
  $('#sN_toggle').live('click', function(){ if(annotations.length){ $(document.documentElement).toggleClass('pins_hidden'); } });
  $('#sN_clear').live('click', function(){annotations = [];$('.sN_pin_cushion').remove();$(document.body).trigger('clear.pin')});
  $('#sN_side_count').live('click', function(){
    if(annotations.length){
      $('#sN_sidebar').toggleClass('sN_hidden');
      $(this).toggleClass('sN_side_closer');
    }
  });

  ///////
  /// PAGE INIT

  function template_pin(into){
    var pin = $('\
       <div class="sN_pin_cushion clickable">\
         <div class="sN_pin"><span></span></div>\
         <div class="sN_annotation sN_hidden">\
            <div class="sN_actions">\
              <div class="sN_delete_annotation">X</div>\
            </div>\
            <textarea></textarea>\
       </div>');
    return into ? pin.appendTo(into) : pin;
  }

  function template_sidebar_item(){
    return $('\
      <li>\
          <div class="sN_num"></div>\
          <div class="sN_text"></div>\
      </li>');
  }

  function template_page(){
    return $('\
       <ul id="sN_menu">\
        <li class="sN_button" id="sN_add"><span>Add</span></li>\
        <li class="sN_button" id="sN_toggle"><span>Toggle</span></li>\
        <li class="sN_button" id="sN_present"><span>Present</span></li>\
        <li class="sN_button" id="sN_share"><span>Share</span></li>\
        <li class="sN_button" id="sN_clear"><span>Clear All</span></li>\
      </ul>\
      <div id="sN_sidebar_wrap">\
        <div id="sN_side_count">0</div>\
        <ol id="sN_sidebar" class="sN_hidden">\
        </ol>\
      </div>').appendTo(document.body);
  }

  $(function(){
    template_page();

    //hash everything, we're going to be using it.
    $('*').each(function(i, el) { //XXX problematic on large docs?
      var hash = exports.hash_node(el);
      if (LUT[hash]) {
        if (!LUT[hash].push) { LUT[hash] = [LUT[hash]]; }
        LUT[hash].push(el);
      } else {
        LUT[hash] = el;
      }
      $.data(el, AH, exports.hash_node(el));
    });

    window.$ = $; //XXX for testing
  });

  // The bookmarklet is ready for use
  window.bookmarkletPreloaderDone = function(bookmarkletUrl, forceNew) {
    // determine if we have annotation session for this url
    var matches = document.cookie.match(/citation_session=([\w]+)/),
        setCitationSession = function(id) {
          window.sitations.sessionId = id;
          document.cookie = "citation_session=" + 
                            window.sitations.sessionId + 
                            "; expires=" +
                            (new Date((new Date().getTime()+
                              (1000*60*60*24*30)))).toGMTString() +
                            "; domain=sitations.com";
        };
    
    if (matches && matches.length === 2 && !forceNew) {
      setCitationSession(matches[1]);

      $.ajax({
        url: bookmarkletUrl + "/citation/" + window.sitations.sessionId,
        type: 'get',
        dataType: 'json',
        success : function(data) {
          // XXX: hydrate the session into dom elements
        },
        error : function() {
          // Create a new session, cuz we're baller like that.
          window.document.cookie="";
          window.bookmarkletPreloaderDone(bookmarkletUrl, true);
        }
      });

    // This is a new session
    } else {
      $.ajax({
        url: bookmarkletUrl + "/citation/",
        type: "post",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
          url: window.location.toString(),
          notes:[]
        }),
        success : function(session) {
          setCitationSession(session.id);
        },
        error : function(session) {
          // TODO: bit of error handling might be handy here?
        }
      });
    }
  };


})(jQuery.noConflict());

(function($) {
/*
* Auto-growing textareas; technique ripped from Facebook
* Code from http://javascriptly.com/examples/jquery-grab-bag/autogrow-textarea.html
*/
  $.fn.autogrow = function(options) {

    this.filter('textarea').each(function() {

      var $this       = $(this),
          minHeight   = $this.height();

      var shadow = $('<div></div>').css({
        position:   'absolute',
        top:        -10000,
        left:       -10000,
        width:      $(this).width(),
        fontSize:   $this.css('fontSize'),
        fontFamily: $this.css('fontFamily'),
        lineHeight: $this.css('lineHeight'),
        resize:     'none'
      }).appendTo(document.body);

      var update = function() {

        var val = this.value.replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/&/g, '&amp;')
                            .replace(/\n/g, '<br/>');

        shadow.html(val);
        $(this).css('height', Math.max(shadow.height() + 20, minHeight));
      };

      $(this).change(update).keyup(update).keydown(update);

      update.apply(this);

    });

    return this;
  };
})(jQuery);
// vim: set ft=javascript ff=unix et sw=2 ts=4 :
