
if (!document.getElementById('.sN_menu')){(function($){
  var exports = window, //XXX for testing
      AH = 'annoHash',
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
        offset = target.offset(),
        anchor = { x: pageX - offset.left, y: pageY - offset.top },
        bounds = $.extend({}, anchor),
        citation;
    //console.log(id, cushion, target);
    cushion.css({top: anchor.y - 8, left: anchor.x - 8, position: 'absolute'}).appendTo(target);
    target.css('position', target.css('position').replace('static','relative'));
    citation = {
      path : path_node(target),
      hash : hash_node(target),
      text : $("textarea", target.parent('.sN_pin_cushion')).val(),
      anchor : {
        x: anchor.x,
        y: anchor.y
      },
      bounds : {
        x: bounds.x,
        y: bounds.y
      },
      target : target
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
    var cushion = $(e.target).parents('.sN_pin_cushion')
        loc = {x: e.pageX, y: e.pageY},
        moved = false;
    if (!cushion.data('placed')) {return;}
    function pin_move(e){
      if (Math.max(loc.x - e.pageX, loc.y - e.pageY) > 10){
        moved = true;
        cushion.css({ top: e.pageY - 8, left: e.pageX - 8 });
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
    console.log('blur')
    $(e.target).parent('.sN_annotation').addClass('sN_hidden');
  });

  function halt(e){
    console.log('halt');
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  //$(window).mouseup(function(e) {
  //  e.preventDefault();
  //  return false;
  //});
  $(".sN_pin_cushion, .sN_menu, .sN_sidebar_wrap").live('click', halt);

  function update_side_count(){
    $('#sN_side_count').text(annotations.length);
  }
  $(document.body).bind('place.pin', update_side_count);
  $(document.body).bind('clear.pin', update_side_count);

  $('#sN_add').live('click', do_add);
  $('#sN_toggle').live('click', function(){$(document.body).toggleClass('pins_hidden');});
  $('#sN_clear').live('click', function(){annotations = [];$('.sN_pin_cushion').remove();$(document.body).trigger('clear.pin')});

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
//            <div class="sN_save_wrap clearfix">\
//              <button class="sN_button sN_save_annotation">Save</button>\
//            </div>\
    return into ? pin.appendTo(into) : pin;
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
        <ul id="sN_sidebar"></ul>\
      </div>').appendTo(document.body);
  }

  $(function(){
    $('head').append('<link rel="stylesheet" href="http://localhost:8080/css/main.css" type="text/css" />');
    template_page();

    //hash everything, we're going to be using it.
    $('*').each(function(i, el) { //XXX problematic on large docs?
      var hash = hash_node(el);
      if (LUT[hash]) {
        if (!LUT[hash].push) { LUT[hash] = [LUT[hash]]; }
        LUT[hash].push(el);
      } else {
        LUT[hash] = el;
      }
      $.data(el, AH, hash_node(el));
    });

    window.$ = $; //XXX for testing
  });
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

})(jQuery);}
// vim: set ft=javascript ff=unix et sw=2 ts=4 :
