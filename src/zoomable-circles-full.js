jQuery(document).ready(function($) {

    var filePath = getUrlParameter('data');
    var diameter = getUrlParameter('diameter');
    // set the default diameter to 700px.
    // check the screen size (height or width, amaller one).
    var defaultDiameter = Math.min(screen.width, screen.height) - 100;
    // automatically set the diameter based on the screen size.
    diameter = diameter === undefined ? defaultDiameter : diameter;
    //$('#svgfull').html('file: ' + filePath);
    $.getJSON(filePath, function(data) {
        // rebuild the circles.
        var options = {
          "margin": 20,
          "diameter": diameter
        };
        $("#svgfull").zoomableCircles(options, data);
    });
});

var getUrlParameter = function getUrlParameter(sParam) {

    var query = window.location.search.substring(1);
    var sURLVariables = decodeURIComponent(query).split('&');
    var sParameterName;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? 
                true : sParameterName[1];
        }
    }
};

// show full screen mode, like F11
//toggleFullScreen();
var toggleFullScreen = function toggleFullScreen() {
    if ((document.fullScreenElement && 
         document.fullScreenElement !== null) ||    
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {  
            document.documentElement.requestFullScreen();  
        } else if (document.documentElement.mozRequestFullScreen) {  
            document.documentElement.mozRequestFullScreen();  
        } else if (document.documentElement.webkitRequestFullScreen) {  
          document.body.webkitRequestFullScreen();  
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
