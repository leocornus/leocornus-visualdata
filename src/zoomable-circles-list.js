jQuery(document).ready(function($) {

    $.getJSON('data/list.json', function(data) {

        var visualList = $('#visuallist');
        visualList.html('');
        //console.log(dataList);
        var dataList = data.datalist;
        var colQueue = [];
        for(i = 0; i < dataList.length; i++) {
            console.log(dataList[i]);
            var circleId = 'circle-' + i;
            var theColumn = 
                '<div class="col-sm-6 col-md-4">' +
                '  <div class="thumbnail">' +
                '    <div id="' + circleId + '"' +
                '         data="' + dataList[i] + '">' +
                '    </div>' +
                '    <div class="caption">' +
                '      <h3 id="' + circleId + '-title">' +
                dataList[i] + '</h3>' +
                '      <p id="' + circleId + '-desc">' + 
                dataList[i] + '</p>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            colQueue.push(theColumn);
            var ready2Row = (i + 1) % 3;
            if(ready2Row == 0) {
                visualList.append('<div class="row">' +
                    colQueue.join("") + '</div>');
                // reset the queue.
                colQueue = [];
            }
        }

        if(colQueue.length > 0) {
            visualList.append('<div class="row">' +
                colQueue.join("") + '</div>');
        }

        $("div[id^='circle-']").each(function(index) {

            // get the id attribute.
            var circleId = $(this).attr('id');
            // get data url.
            var dataUrl = $(this).attr('data');

            // jQuery getJSON will read the file from a Web resources.
            $.getJSON(dataUrl, function(data) {
                // TODO: update title, description, and data source.
                if('attributes' in data) {
                    if('title' in data.attributes) {
                        $('#' + circleId + '-title').
                            html(data.attributes.title);
                    }
                    if('description' in data.attributes) {
                        $('#' + circleId + '-desc').
                            html(data.attributes.description);
                    }
                }

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
});
