jQuery(document).ready(function($) {

    // load the example datalist:
    $.getJSON('sunburst/data/week-2017-03-12.json', function(data) {

        $('#visualdata').visualData({date: "2017-03-12"}, data); 
    });

});
