(function($) {
 
  function theInterceptor(ev) {
    ev.preventDefault();
    return false;
  }
  $("a").click(theInterceptor);

  $(document).mousedown(function onDown(ev) {
    if ($(ev.target).parents().andSelf().hasClass("clickable")) {
      return;
    }
    var anchor = { x: ev.clientX, y: ev.clientY },
        bounds = { x: ev.clientX, y: ev.clientY },
      
        // TODO: please god no!
        sel     = $('<canvas class="clickable selection"></canvas>'),
        annotate = $('<div class="clickable annotation"><textarea></textarea></div>');
        
    $("body").append(sel);
    sel.css({
      border: "1px solid #F0F",
      position: "absolute",
      left: anchor.x,
      top : anchor.y,
      height: 0,
      widht: 0
    });    
  
    function onMove(ev) {
      sel.css({
        width: ev.clientX - anchor.x,
        height: ev.clientY - anchor.y
      });
      bounds = { x: ev.clientX, y: ev.clientY };
    }
    $(window).mousemove(onMove);
    $(window).one("mouseup", function onUp(ev) {
      $(window).unbind("mousemove", onMove);
      annotate.css({
        border: "1px solid green",
        position: "absolute",
        left: bounds.x,
        top: anchor.y
      });

      $("body").append(annotate); 
      
    });

    // create a new selection box    
    console.log(ev.clientX, ev.clientY); 
    ev.preventDefault();
    return false;
  });

  $(window).mouseup(function(ev) {

    ev.preventDefault();
    return false;
  });


})(jQuery.noConflict());
