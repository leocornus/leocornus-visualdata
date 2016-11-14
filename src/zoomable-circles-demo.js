jQuery(document).ready(function($) {

    new Clipboard('#copybtn');

    var container = document.getElementById('jsoneditor');
    // load the JSON editor
    var editor = new JSONEditor(container, {});
    // get the URL to JSON file.
    var dataUrl = $('#example').val();
    // initially load the data.
    loadData(dataUrl, editor);

    // change examples .
    $('#example').change(function() {
        dataUrl = $(this).val();
        loadData(dataUrl, editor);
    });

    // rebuild the circles.
    $('#reload').click(function() {
        // remove the existing one.
        $('#svgpreview').empty();
        // rebuild the circles.
        var options = {
          "margin":20,
          "diameter":500
        };
        $("#svgpreview").zoomableCircles(options, editor.get());
        // update the JSON source code.
        $('#jsonstring').html(JSON.stringify(editor.get()).
                              replace(/,/g, ',\n'));
    });

    // load the circles in full screen, using modal for now.
    //$('#fullscreen').click(function() {
    $('#fullScreenModal').on('show.bs.modal', function(e) {

        $('#svgfullscreen').empty();
        var diameter = $('#fullscreenSize').val();
        // rebuild the circles.
        var options = {
          "margin":10,
          "diameter":diameter
        };
        $("#svgfullscreen").zoomableCircles(options, editor.get());
        // update the JSON source code.
        $('#jsonstring').html(JSON.stringify(editor.get()).
                              replace(/,/g, ',\n'));
    });

    // remove the preview svg when closing the modal.
    $('#fullScreenModal').on('hidden.bs.modal', function(e) {
        $('#svgfullscreen').empty();
    });

    // load the full page to show current circles.
    $('#fullpage').on('click', function(e) {

        var filePath = $('#example').val();
        var url = 'zoomable-circle-full.html?data=' + filePath;
        window.location.href = url;
    });

    $('#iconFullscreen').click(function() {

        // show full screen
        toggleFullScreen(document.getElementById('svgpreview'));
    });
});

/**
 * load data from the given url, set it to JSON editor and load
 * the zoomable circles.
 */
function loadData(dataUrl, jsonEditor) {

    // jQuery getJSON will read the file from a Web resources.
    $.getJSON(dataUrl, function(data) {
    //$.getJSON('data/simple-zoomable-circle.json', function(data) {
        // set data to JSON editor.
        jsonEditor.set(data);
        // update the JSON source code
        $('#jsonstring').html(JSON.stringify(data).
                              replace(/,/g, ',\n'));
        // remove the existing one.
        $('#svgpreview').empty();
        // build the circles...
        var options = {
          "margin":10,
          "diameter":500
        };
        $("#svgpreview").zoomableCircles(options, data);
        //console.log(JSON.stringify(data));
    });
}

// show full screen mode, like F11
//toggleFullScreen();
var toggleFullScreen = function toggleFullScreen(elm) {

    if ((document.fullScreenElement && 
         document.fullScreenElement !== null) ||    
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (elm.requestFullScreen) {  
            elm.requestFullScreen();  
        } else if (elm.mozRequestFullScreen) {  
            elm.mozRequestFullScreen();  
        } else if (elm.webkitRequestFullScreen) {  
          elm.webkitRequestFullScreen();  
      }  
    } else {  
        if (document.cancelFullScreen) {  
          document.cancelFullScreen();  
        } else if (document.mozCancelFullScreen) {  
          document.mozCancelFullScreen();  
        } else if (document.webkitCancelFullScreen) {  
          document.webkitCancelFullScreen();  
        }  
    }  
};
