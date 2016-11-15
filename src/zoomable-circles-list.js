jQuery(document).ready(function($) {

    $("div[id^='circle-']").each(function(index) {
        // get the id attribute.
        var circleId = $(this).attr('id');
        // get data url.
        var dataUrl = $(this).attr('data');

        // jQuery getJSON will read the file from a Web resources.
        $.getJSON(dataUrl, function(data) {
            // build the circles...
            var options = {
              "margin":10,
              "diameter":300
            };
            $("#" + circleId).zoomableCircles(options, data);
            //console.log(JSON.stringify(data));
        });
    });

});
