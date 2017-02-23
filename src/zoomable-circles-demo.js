jQuery(document).ready(function($) {

    // initialize the clipboard on button copybtn
    new Clipboard('#copybtn');
    var container = document.getElementById('jsoneditor');
    // load the JSON editor
    var editor = new JSONEditor(container, {});

    // load the example datalist:
    $.getJSON('data/list.json', function(data) {

        var dataList = data.datalist;
        var labelList = data.labelList;
        // clear the demo data.
        $('#example').html('');
        for(i=0; i < dataList.length; i++) {
            var option = '<option value="' + dataList[i] + '">' +
                labelList[i] + '</option>';
            $('#example').append(option);
        }

        // get the URL to JSON file.
        var dataUrl = dataList[0];
        // initially load the data.
        loadData(dataUrl, editor);
    });

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
        $('#jsonstring').html(JSON.stringify(editor.get(), null, 2));
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
        $('#jsonstring').html(JSON.stringify(editor.get(), null, 2));
    });

    // remove the preview svg when closing the modal.
    $('#fullScreenModal').on('hidden.bs.modal', function(e) {
        $('#svgfullscreen').empty();
    });

    // load the full page to show current circles.
    $('#fullpage').on('click', function(e) {

        var filePath = $('#example').val();
        var url = 'index-full.html?data=' + filePath;
        window.location.href = url;
    });

    $('#iconFullscreen').click(function() {

        // show full screen
        toggleFullScreen(document.getElementById('svgpreview'));
    });

    //============================================================
    // tools for dynamic scale panel.
    //============================================================

    /**
     * generate dynamically scaled circles.
     */
    $('#generate').on('click', function() {

        // get the total size.
        var totalSize = parseInt($('#totalSize').val());
        // get amount of circles.
        var circleAmount = parseInt($('#circleAmount').val());
        // get step length.
        var stepLength = parseInt($('#stepLength').val());

        // try to calculate the total amout for circles.
        circleAmount = (totalSize - stepLength) / (stepLength * 3);

        // using the category 20 for quick demo. 
        var color = d3.scale.category20();
        // preparing the circles.
        var circles = [];
        for(var i = 0; i < circleAmount; i++) {
            var name = '' + i;
            var size = i == 0 ? stepLength : (i + 1) * stepLength * 3;
            var circle = {
              "name": name,
              "children":[{
                "name": name + '-' + size,
                "size": size,
                "leafFill": color(i),
                "imgUrl": ''
              }]
            };

            circles.push(circle);
        }

        var jsonData = {
          "attributes": {
            "title": "3 Equal size circles",
            "description": "Data example to show the data structure",
            "dataSource": '',
            "colorRange": [
              "white"
            ],
            "leafFill": "green"
          },
          "data": {
            "name":"This will NOT show anywhere!",
            "children": circles
          }
        };

        editor.set(jsonData);
        // remove the existing one.
        $('#svgpreview').empty();
        // rebuild the circles.
        var options = {
          "margin":20,
          "diameter":500
        };
        // draw the zoomable circles.
        $("#svgpreview").zoomableCircles(options, jsonData);
        $('#jsonstring').html(JSON.stringify(editor.get(), null, 2));
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
        $('#jsonstring').html(JSON.stringify(data, null, 2));
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
