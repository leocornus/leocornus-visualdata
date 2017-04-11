/**
 * create the jQuery plugin visualData, it will be very simple
 * to use:
 *
 *  jQuery('#div-id').visualData(options, data);
 */

;(function($) {

    // set the plugin name bilevelSunburst.
    var pluginName = 'visualData';
    // set the default options.
    var defaultOptions = {
        // deminsion of the visual area, default is 500px
        width: 500,
        height: 500,
        // margin for the sunburst, default is 10px
        margin: 10,
    };

    /**
     * the constructor for bilevelSunburst plugin.
     */
    function Plugin(element, options, jsonData) {
        // same the DOM element.
        this.element = element;
        this.jsonData = jsonData;
        // merge the options.
        // the jQuery extend function, the later object will
        // overwrite the former object.
        this.options = $.extend({}, defaultOptions, options);
        // set the plugin name.
        this._name = pluginName;
        // call the initialize function.
        this.init();
    }

    // add the plugin to the jQuery chain.
    $.fn[pluginName] = function(options, jsonData) {

        // return to maintain the chain.
        return this.each(function() {
            // check the local storage index for the current
            // element.
            var dataKey = "plugin_" + pluginName;
            if(!$.data(this, dataKey)) {
                // no plugin created yet, let create a new one.
                $.data(this, dataKey, 
                       new Plugin(this, options, jsonData));
            } else{
                // replace with new one.
                //$.data(this, "plugin_" + pluginName, 
                //       new Plugin(this, options, jsonData));
                // try reload for the existing plugin.
                var plugin = $.data(this, dataKey);
                plugin.reload(options, jsonData);
            }
        });
    };

    /**
     * extend the prototype for the class method.
     */
    $.extend(Plugin.prototype, {

        /**
         * initialize function
         */
        init: function() {

            var self = this;
            var $element = $(this.element);
            self.attrId = $element.attr('id');
            // add the attribute ID as the prefix to 
            // make the id unique.
            self.options.chartId = self.attrId + '-chart';
            self.options.summaryId = self.attrId + '-summary';
            //$element.html("Here I am...");
            self.buildDashboard();
        },

        /**
         * reload the plugin.
         */
        reload: function(options, jsonData) {

            //console.log(jsonData);
            var self = this;
            // remove the existing one.
            $('#' + self.attrId).empty();

            // need merge the options with default options.
            self.options = $.extend({}, defaultOptions, options);
            self.jsonData = jsonData;
            self.init();
        },

        /**
         * build the panel as dashboard.
         */
        buildDashboard: function() {

            var self = this;

            var panel =
'<div class="panel panel-success">' +
'  <div class="panel-heading">' +
'    visual data dashboard mockups' +
'  </div>' +
'  <div class="panel-body">' +
'    <div class="row">' +
// the visual chart.
'      <div class="col-md-8">' +
'        <div id="' + self.options.chartId + '">Charts</div>' +
'      </div>' +
// the information column
'      <div class="col-md-4">' +
'        <div id="' + self.options.summaryId + '">Summary</div>' +
'      </div>' +
'    </div>' +
'  </div>' +
'  <div class="panel-footer">' +
'    visual data footer mockups' +
'  </div>' +
'</div>';

            $('#' + self.attrId).html(panel);

            // Draw the chart,
            $('#' + self.options.chartId).html('')
              .bilevelSunburst({date: "2017-03-12"}, self.jsonData);
        }
    });

})(jQuery);
