(function($) {
  var session = {
    url   : window.location + "",
    notes : []
  };

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
    var origTarget = $(ev.target),
        offset = origTarget.offset(),
        pos    = origTarget.position(),
        anchor = { x: ev.pageX - offset.left, y: ev.pageY - offset.top },
        bounds = $.extend({}, anchor),

        // TODO: please god no!
        sel     = $('<canvas class="clickable selection"></canvas>'),
        annotate = $('<div class="clickable annotation"><textarea></textarea></div>');

    origTarget.append(sel);
    sel.css({
      border: "1px solid #F0F",
      position: "absolute",
      left: anchor.x,
      top : anchor.y,
      height: 0,
      widht: 0
    });

    function onMove(moveEvent) {
        var width = moveEvent.pageX - offset.left - anchor.x,
            height = moveEvent.pageY - offset.top - anchor.y;
      sel.css({
        width: width,
        height: height
      });
      bounds = { x: anchor.x + width, y: anchor.y + height };
    }

    $(window).mousemove(onMove);
    $(window).one("mouseup", function onUp(ev) {
      $(window).unbind("mousemove", onMove);
      annotate.css({
        border: "1px solid green",
        position: "absolute",
        left: offset.left + anchor.x,
        top: offset.top + anchor.y
      });

      origTarget.append(annotate);

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
          path : path_node(origTarget),
          hash : hash_node(origTarget),
          text : $("textarea", annotate).val(),
          anchor : {
            x: anchor.x,
            y: anchor.y
          },
          bounds : {
            x: bounds.x,
            y: bounds.y
          }
        };
        session.notes.push(citation);
        var pin = $('<div class="pin" />');
        pin.css({
            background: 'green',
            border: '1px solid green',
            width: '10px',
            height: '10px',
            position: 'absolute',
            top: anchor.y,
            left: anchor.x
        });
        origTarget.css('position', origTarget.css('position').replace('static','relative'));
        origTarget.append(pin);

        // save off our state
        $.ajax({
          // TODO: this needs to be the url where the bmklt came from
          url: window.bookmarkletSourceUrl + '/citation/',
          type: "post",
          contentType: "application/json",
          dataType: "json",
          data: JSON.stringify(session),
          success : function() {
            // saved successfully
          },
          error  : function() {
            throw new Error(arguments);
          },
          complete : function() {

          }
        });
      });
    });

    // create a new selection box
    ev.preventDefault();
    return false;
  });
  $(window).mouseup(function(ev) {
    ev.preventDefault();
    return false;
  });
})(jQuery.noConflict());
