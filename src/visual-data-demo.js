jQuery(document).ready(function($) {

    // load the example datalist:
    //$.getJSON('sunburst/data/week-2017-03-12.json', function(data) {

    //    $('#visualdata').visualData({date: "2017-03-12"}, data); 
    //});

    // let's try the d3 queue
    var queue = d3.queue();
    queue.defer(d3.json, "sunburst/data/day-2017-05-07.json");
    queue.defer(d3.json, "sunburst/data/day-2017-05-08.json");
    queue.defer(d3.json, "sunburst/data/day-2017-05-09.json");
    queue.defer(d3.json, "sunburst/data/week-2017-03-12.json");
    queue.awaitAll(function(error, results) {
        if (error) {
            throw error;
        }
        var theData = d3.merge(results);
        // combine the same path.
        var combinedData = {};
        theData.forEach(function(aPage, index) {
            path = aPage[0];
            //if(Object.keys(combinedData).indexOf(path) < 0) {
            if(!combinedData.hasOwnProperty(path)) {
                combinedData[path] = aPage;
            } else {
                combinedData[path] = [path,
                            // sessions.
                            combinedData[path][1] + aPage[1],
                            // pageviews.
                            combinedData[path][2] + aPage[2]];
            }
        });
        if(typeof Object.values === "function") {
            theData = Object.values(combinedData);
        } else {
            // IE
            theData = [];
            for(key in combinedData) {
                theData.push(combinedData[key]);
            }
        }
        // sort by pageviews.
        theData = theData.sort(function(a, b) {
            return b[2] - a[2];
        });
        //console.log(d3.merge(results));
        $('#visualdata').visualData({date: "2017-03-12"}, theData); 
    });
});
