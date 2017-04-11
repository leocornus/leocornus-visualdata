jQuery(document).ready(function($) {

    // load the example datalist:
    $.getJSON('sunburst/data/week-2017-03-12-sunburst.json', function(data) {

        $('#visualdata').visualData({}, data); 
    });

});
