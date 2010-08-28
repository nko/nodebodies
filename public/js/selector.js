(function($) {
  var annotations = [];

  function theInterceptor(ev) {
    ev.preventDefault();
    return false;
  }
  $("a").click(theInterceptor);

  $(document).mousedown(function onDown(ev) {

    // unbind the document.mousedown until this annotation is finished
    $(document).unbind("mousedown", onDown);

    if ($(ev.target).parents().andSelf().hasClass("clickable")) {
      return;
    }
    var anchor = { x: ev.clientX, y: ev.clientY },
        bounds = { x: ev.clientX, y: ev.clientY },
        origTarget = ev.target,
      
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
  
    function onMove(moveEvent) {
      sel.css({
        width: moveEvent.clientX - anchor.x,
        height: moveEvent.clientY - anchor.y
      });
      bounds = { x: moveEvent.clientX, y: moveEvent.clientY };
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

      $(window).click(function removeFocus(ev) {
        if ($(ev.target).parents().andSelf().hasClass("clickable")) {
          return;
        } 
        // re-bind the document.mousedown so we can handle another annotation!
        $(document).mousedown(onDown);
        $(".clickable").remove();
        $(window).unbind("click", removeFocus);
        
        // add this citation to the list
        var citation = {
          node : {
            path : path_node(origTarget),
            hash : hash_node(origTarget)
          },
          text : $("textarea", annotate).val(),
          bounds : {
            anchor : {
              x: anchor.x,
              y: anchor.y
            },
            bounds : {
              x: bounds.x,
              y: bounds.y
            }
          }
        };
        annotations.push(citation);
        console.dir(annotations);
        var pin = $('<div style="border:1px solid green; width:10px; height:10px" class="pin"></div>');
        pin.insertBefore();
      });
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
