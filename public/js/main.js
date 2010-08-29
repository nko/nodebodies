(function($){
  var exports = window.sitations = {
        annotations : {}
      },
      AH = 'annoHash',
      console = window.console || { log:function(){} },
      LUT = {},
      //annotations = [],
      annotations = [{"path":"html","hash":535358305268184530,"text":"sdf","anchor":{"x":395,"y":211},"bounds":{"x":395,"y":211}},{"path":"html>body","hash":65417765280628120,"text":"lkj","anchor":{"x":93,"y":12},"bounds":{"x":93,"y":12}},{"path":"a","hash":70653162063225,"text":"test","anchor":{"x":12.850006103515625,"y":5},"bounds":{"x":12.850006103515625,"y":5}}],
      toJSON = Object.toJSON || JSON.stringify;

  exports.annotations = annotations;

  ///////
  /// NODE IDENTIFICATION & MATCHING

  exports.hash_node = hash_node;
  function hash_node(x) {
    var ret = (x.appendTo ? x.data(AH) : $.data(x, AH)), html, i, ii, ix;
    if (ret) {  return ret; }
    html = $(x).html().replace(/\W/g,'');
    ret = 0 - (-1 >>> 1);
    ret += parseInt(html.substr(0, 10), 36) || 0;
    ret += parseInt(html.substr(Math.max(html.length - 11, 0)), 36) || 0;
    for (i = 0, ii = html.length, ix = (~~(html.length / 10) || 1); i < ii; i += ix) {
      ret += parseInt(html[i], 36) || 0;
    }
    ret += html.length;
    return ret + "";
  };

  function matches_path(n, pathstr) {
    var res;
    res = $(pathstr).filter(function(){ return $.data(this, AH) == n; });
    if (res[0]) {
      return res[0];
    }
    return null;
  }

  exports.get_node = get_node;
  function get_node(n, pathstr) {
    var res = LUT[n],
        path, working;
    if (!pathstr || (res && !res.push)) {
      return res;
    } else {
      if($(pathstr).data(AH) == n) {
        return $(pathstr)[0];
      }
      path = pathstr.split('>');
      working = pathstr;
      while(path.length > 0) {
        res = matches_path(n, working);
        if (res && res[0]) { return res[0]; }
        res = matches_path(n, working.substr(0, working.indexOf(/:nth\(\d+\)$/)));
        if (res && res[0]) { return res[0]; }
        path.pop();
        working = path.join('>');
      }
      return $(pathstr)[0] || LUT[n][0]; //XXX not sure about this
    }
  };

  exports.path_node = path_node;
  function path_node(x) {
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
  function save_pins() {
    if (!exports.sessionId) { return; }
    var i = 0, l = annotations.length, pin;

    exports.session = {url : window.location.toString(), notes: []};
    for (i; i<l; i++) {
      pin = annotations[i];
      exports.session.notes.push({
        hash: pin.hash,
        path: pin.path,
        text: pin.text,
        anchor: pin.anchor,
        bounds: pin.bounds
      });
    }
    $.ajax({
      url: 'http://sitations.com/citation/' + exports.sessionId,
      type: 'put',
      contentType: 'application/json',
      dataType: 'json',
      data : toJSON(exports.session),
      sucess : function(data) {},
      error : function() { console.dir(arguments) }
    });
  }
  
  $(document.body).bind('text.pin', save_pins);

  exports.load_pins = load_pins;
  function load_pins(arr) {
    var cur, target, cushion;
    arr = arr || annotations;
    clear_pins();
    annotations = arr;
    for (var i = 0, ii = arr.length; i < ii; i++) {
      cur = annotations[i];
      target = get_node(cur.hash, cur.path);
      if (!target) {
        console.log('failed to find', cur.hash, cur.path)
        continue;
      }
      cur.id = i;
      cur.cushion = template_pin(target);
      cur.cushion.data('placed', true);
      create_pin(cur, $(target));
      update_pin({}, cur);
      update_sidebar_item({}, cur);
    }
  }

  exports.clear_pins = clear_pins;
  function clear_pins() {
    annotations = [];
    $('.sN_pin_cushion').remove();
    $(document.body).trigger('clear.pin');
  }

  function create_pin(citation, target) {
    citation.cushion.css({top: citation.anchor.y - 8, left: citation.anchor.x - 8, position: 'absolute'}).prependTo(target);
    target.css('position', target.css('position').replace('static','relative'));
    $(document.body).trigger('place.pin',[citation]);
  }

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
    citation = {
      path : path_node(target),
      hash : hash_node(target),
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
      cushion : cushion,
      sidebar : sidebar,
      id : id
    };
    annotations[id] = citation;
    create_pin(citation, target)
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
      $(document.documentElement).toggleClass('sN_all_hidden');
      var target = document.elementFromPoint(e.pageX, e.pageY);
      $(document.documentElement).toggleClass('sN_all_hidden');

      cushion.data('placed', true);
      cushion.find('.sN_pin').css('cursor','move');

      //place pin
      place_pin(cushion.attr('id'), target, e.pageX, e.pageY);
    });
  }

  // pin click -> edit text
  $('.sN_pin').live('mouseup', function(e){
      var cushion = $(e.target).parents('.sN_pin_cushion'),
          id = cushion.attr('id');
      cushion.find('.sN_annotation').removeClass('sN_hidden');
      cushion.find('textarea').autogrow();
      setTimeout(function(){$('#'+id).find('textarea').focus();}, 0); //if we don't timeout it, this screws up when we reparent the cushion
  });

  // Drag & Drop pin
  $('.sN_pin').live('mousedown', function(e){
    var cushion = $(e.target).parents('.sN_pin_cushion'),
        loc = {x: e.pageX, y: e.pageY},
        moved = false;
    if (!cushion.data('placed')) {return;}
    e.preventDefault();
    function pin_move(e){
      if (moved || Math.max(loc.x - e.pageX, loc.y - e.pageY) > 8){
        moved = true;
        cushion.appendTo(document.documentElement);
        cushion.css({ top: e.pageY - 8, left: e.pageX - 8 });
      }
    }
    $(window).mousemove(pin_move);
    $(window).one("mouseup", function (e) {
      $(window).unbind("mousemove", pin_move);

      if(moved) {
        //get the element underneath the pin
        $(document.documentElement).toggleClass('sN_all_hidden');
        var target = document.elementFromPoint(e.pageX, e.pageY);
        $(document.documentElement).toggleClass('sN_all_hidden');

        //place pin
        place_pin(cushion.attr('id'), target, e.pageX, e.pageY);
      }
    });
  });
  $('.sN_annotation>textarea').live('blur', function(e){
    var id = ~~($(e.target).parents('.sN_pin_cushion').attr('id').substr(3)),
        citation = annotations[id];

    if(!citation) return;

    setTimeout(function(){$(e.target).parent('.sN_annotation').addClass('sN_hidden');},50);
    citation.text = e.target.value || '';
    $(document.body).trigger('text.pin', [citation]);
  });

  function halt(e){
    //console.log('halted', e);
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  function update_pin(e, citation) {
    elem = citation.cushion;

    if(!elem) { return; }

    elem.attr('id', 'sN_'+citation.id);
    elem.find('.sN_pin > span').text(citation.id + 1);
    elem.find('textarea').val(citation.text);
  }

  function update_sidebar_item(e, citation) {
    //console.log('citation', citation);
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
  $(document.body).bind('remove.pin', update_side_count);

  $(document.body).bind('text.pin', update_sidebar_item);
  $(document.body).bind('clear.pin', function(){
    $('#sN_sidebar').empty().addClass('sN_hidden');
    $('#sN_side_count').removeClass('sN_side_closer');
  });

  $(".sN_pin_cushion .sN_delete_annotation").live('click', function(e){
    var target = $(e.target),
        id = ~~(target.attr('id').substr(3)),
        citation = annotations[id],
        cur;

    //renumber everything after
    for (var i = id, ii = annotations.length; i < ii; i++) {
      cur = annotations[i];
      cur.id--;
      if(i == -1) {continue;}
      update_pin({}, cur);
      update_sidebar_item({}, cur);
    }

    //delete the citation
    $(citation.sidebar).remove();
    $(citation.cushion).remove();
    annotations.splice(id, 1);

    $(document.body).trigger('remove.pin', [citation]);
    if(annotations.length == 0) { $(document.body).trigger('clear.pin') }
  });

  // What happens in citations stays in citations.
  $(".sN_pin_cushion, .sN_menu, .sN_sidebar_wrap").live('click', halt);

  //Action button handlers
  $('#sN_menu>.sN_button:not(#sN_toggle)').live('click',function(){
    $(document.documentElement).removeClass('sN_pins_hidden');
  })
  $('#sN_add').live('click', do_add);
  $('#sN_toggle').live('click', function(){ if(annotations.length){ $(document.documentElement).toggleClass('sN_pins_hidden'); } });
  $('#sN_clear').live('click', clear_pins);
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
            <div class="sN_delete">\
              <div class="sN_delete_annotation">X</div>\
            </div>\
            <textarea></textarea>\
       </div>');
    return into ? pin.prependTo(into) : pin;
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

    load_pins();
  });

  // The bookmarklet is ready for use
  window.bookmarkletPreloaderDone = function(bookmarkletUrl, forceNew) {
    // determine if we have annotation session for this url
    var matches = document.cookie.match(/citation_session=([\w]+)/),
        setCitationSession = function(id) {
          exports.sessionId = id;
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
          load_pins(data.notes);
          exports.session = data;
          longPoll();
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
        data: toJSON({
          url: window.location.toString(),
          notes: new Array()
        }),
        success : function(session) {
          exports.session = session;
          setCitationSession(session._id);
          longPoll();
        },
        error : function(session) {
          // TODO: bit of error handling might be handy here?
        }
      });
    }

    function longPoll() {
      $.ajax({
        url: bookmarkletUrl + "/events/" + exports.sessionId,
        type: "get",
        dataType: "json",
        success : function(session) {
          if (session) {
            exports.session = session;
            setCitationSession(session._id);
          }
        },  
        error : function(session) {
          // TODO: bit of error handling might be handy here?
        },
        complete: function() {
          longPoll();
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
