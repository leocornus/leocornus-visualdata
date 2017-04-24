/**
 * create the jQuery plugin bilevelSunburst, it will be very simple
 * to use:
 *
 *  jQuery('#circle-div-id').bilevelSunburst(options, jsonData);
 */

;(function($) {

    // set the plugin name bilevelSunburst.
    var pluginName = 'bilevelSunburst';
    // set the default options.
    var defaultOptions = {
        // diameter of the sunburst, 
        // the default diameter is 500px
        diameter: 500,
        // margin for the sunburst, 
        // the default margin is 5px
        margin: 5,
        // user customized way to build the explanation div.
        // default is null, which will fall back to the built-in
        // function to build the explanation.
        explanationBuilder: null,
        // styler
        explanationStyler: null,
        // updater, pass the whole data set as parameter.
        explanationUpdater: null
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

            // save this id attribute.
            // it will be used as an unique id to identify this 
            // bilevel sunburst chart.
            self.attrId = $element.attr('id');
            //$element.html("I am sunburst! I am comming up now...");
            // get ready the scale colors.
            self.hue = d3.scale.category20c();
            self.luminance = d3.scale.sqrt()
                .domain([0, 1e6])
                .clamp(true)
                .range([90, 20]);

            // format number.
            self.formatNumber = d3.format(",d");
            self.formatPercentage = d3.format(".2%");

            // get ready the d3.svg.arc object.
            self.arc = d3.svg.arc()
                .startAngle(function(d) { return d.x; })
                .endAngle(function(d) { return d.x + d.dx ; })
                .padAngle(.01)
                //.padRadius(self.options.diameter / (2 * 3))
                // 6 = 2 * 3, we are using diameter instead of 
                // radius, 
                .padRadius(self.options.diameter / 6)
                .innerRadius(function(d) { 
                    return self.options.diameter / 6 * d.depth; 
                })
                .outerRadius(function(d) { 
                    return self.options.diameter / 6 * (d.depth + 1) - 1; 
                });

            // append the explanation div.
            self.appendExplanationDiv();
            // draw the sunburst chart.
            self.draw();
            // apply the stles for explanation.
            self.applyExplanationStyles();
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
         * append the explanation div and the inline styles for it.
         * the option explanationBuilder will be checked to 
         * allow developer to customize the explanation div
         * 
         *  self.options.explanationBuilder(prefix);
         */
        appendExplanationDiv: function() {

            var self = this;

            var bsExplanation = '';
            if(self.options.explanationBuilder) {
                // call customized explanation builder.
                bsExplanation = 
                    self.options.explanationBuilder(self.attrId);
            } else {
                bsExplanation = 
                    self.buildDefaultExplanation(self.attrId);
            }

            $('body').append(bsExplanation);
        },

        /**
         * apply styles for the explanation div.
         * this should happen after we have the location and offset
         * of the svg.
         */
        applyExplanationStyles: function() {

            var self = this;

            // calculate the location and offset.

            // the largest rectangle that can be inscribed in a 
            // circle is a square.

            // calculate the offset for the center of the chart.
            var offset = $('#' + self.getGenericId('svg')).offset();
            var top = offset['top'] + self.options.diameter / 2;
            var left = offset['left'] + self.options.diameter / 2;

            // the center circle's the diameter is a third of the 
            // self.options.diameter.
            var centerRadius = self.options.diameter / 6;
            var squareX = Math.sqrt(centerRadius * centerRadius / 2);

            // top and left for the explanation div.
            top = top - squareX;
            left = left - squareX - 30;

            // the main explanation div.
            $('#' + self.getGenericId('explanation'))
              .css('position', 'absolute')
              .css('text-align', 'center')
              // The z-index property specifies the z-order of a 
              // positioned element and its descendants. 
              // When elements overlap, z-order determines 
              // which one covers the other. 
              // An element with a larger z-index 
              // generally covers an element with a lower one.
              // FIXME: seems we need use class to utilize the 
              // -1 z-index, which will help position 
              // the explanation div under the circle.
              //.css('z-index', '2000')
              .attr('class', 'bs-explanation')
              // set the border, most time is for debugging..
              .css('border', '0px solid black')
              .css('width', '180px')
              .css('top', top + 'px')
              .css('left', left + 'px');

            $('#' + self.getGenericId('pageviews'))
              .css('font-size', '2.5em')
              .css('color', '#316395');

            $('#' + self.getGenericId('percentage'))
              .css('font-size', '1.5em')
              .css('color', '#316395');

            $('#' + self.getGenericId('date'))
              .css('font-weight', 'bold');

            $('#' + self.getGenericId('group'))
              .css('font-weight', 'bold');
        },

        /**
         * build the default explanation div.
         * follow the generic id rule.
         */
        buildDefaultExplanation: function(prefix) {

            var divHtml =
'<div id="' + prefix + '-explanation">' + 
'  Day <span id="' + prefix + '-date"></span><br/>' +
'  <span id="' + prefix + '-pageviews">40%</span><br/>' +
'  Pageviews - <span id="' + prefix + '-group">All Pages' +
'</span><br/>' +
'  <span id="' + prefix + '-percentage">100%</span>' +
'</div>';

            return divHtml;
        },

        /**
         * start drawing.
         */
        draw: function() {

            var self = this;

            // get ready the svg.
            self.svg = d3.select('#' + self.attrId).append("svg")
                // using the generic rule for the id.
                .attr("id", self.getGenericId('svg'))
                //.attr("width", margin.left + margin.right)
                .attr('width', self.options.diameter)
                //.attr("height", margin.top + margin.bottom)
                .attr('height', self.options.diameter)
              .append("g")
                .attr("transform", 
                       "translate(" + self.options.diameter/ 2 + 
                       "," + self.options.diameter/ 2 + ")");

            // get ready the partition.
            self.partition = d3.layout.partition()
                .sort(function(a, b) {
                  return d3.ascending(a.name, b.name);
                })
                .size([2 * Math.PI, self.options.diameter / 2]);

            // set the data.
            var root = self.jsonData;

            // Compute the initial layout on the entire tree to 
            // sum sizes.
            // Also compute the full name and fill color 
            // for each node,
            // and stash the children so they can be 
            // restored as we descend.
            self.partition
                .value(function(d) { return d.size; })
                .nodes(root)
                .forEach(function(d) {
                  d._children = d.children;
                  d.sum = d.value;
                  d.key = self.key(d);
                  d.fill = self.fill(d);
                });
            //console.log(root);
            // after comupte, the root value will be the total value.
            self.totalValue = root.value;
            // update the explanation div.
            $('#' + self.getGenericId('date'))
                .text(self.options.date);
            $('#' + self.getGenericId('pageviews'))
                .text(self.formatNumber(self.totalValue));

            // Now redefine the value function to use 
            // the previously-computed sum.
            self.partition
                .children(function(d, depth) { 
                    return depth < 2 ? d._children : null;
                })
                .value(function(d) { return d.sum; });

            // draw the center circle and hook the zoom out event.
            self.center = self.svg.append("circle")
                .attr("r", self.options.diameter / 6)
                //.on("click", zoomOut);
                .on("click", function(d, i) {
                    self.zoomOut(d);
                });
            // add the title for tooltip.
            self.center.append("title")
                //.text(function(d) {
                //    return d.name + "\n" + formatNumber(d.value);
                //});
                .text("zoom out");

            // manipulate the path.
            self.path = self.svg.selectAll("path")
                .data(self.partition.nodes(root).slice(1))
              .enter().append("path")
                .attr("d", self.arc)
                .style("fill", function(d) { 
                    //console.log(d.fill);
                    return d.fill; 
                })
                .each(function(d) { 
                    this._current = self.updateArc(d); 
                })
                //.on("click", zoomIn);
                .on("click", function(d, i) {
                    self.zoomIn(d);
                });
            // add the tooltip
            self.path.append("title")
                .text(function(d) {
                    return d.name + "\n" + 
                       self.formatNumber(d.value) + 
                       " Pageviews\n" +
                       self.formatPercentage(d.value / self.totalValue) + 
                       " of total pageviews";
                });
        },

        /** 
         * handle zoomin, it happen on arcs.
         */
        zoomIn: function(p) {

            var self = this;

            if (p.depth > 1) p = p.parent;
            // no children
            if (!p.children) return;

            //console.log("zoom in p.value = " + p.value);
            //console.log("zoom in p.name = " + p.name);
            self.updateExplanation(p.value, p.name);

            self.zoom(p, p);
        },

        /**
         * update the explanation div.
         * 
         * TODO: Should allow user to update through the 
         * self.options.explanationUpdater.
         */
        updateExplanation: function(pageviews, name) {

            var self = this;

            $("#" + self.getGenericId('pageviews'))
                .text(self.formatNumber(pageviews));
            $("#" + self.getGenericId("group")).text(name);
            var percentage = pageviews / self.totalValue;
            $("#" + self.getGenericId("percentage"))
                .text(self.formatPercentage(percentage));
        },

        /**
         * handle zoomout, for center circle.
         */
        zoomOut: function(p) {

            var self = this;

            if (!p) return;
            if (!p.parent) return;

            //console.log("zoom out p.value = " + p.parent.value);
            //console.log("zoom out p.name = " + p.parent.name);
            //console.log(p.parent);
            self.updateExplanation(p.parent.sum, p.parent.name);

            self.zoom(p.parent, p);
        },

        /**
         * the actual magic to handle zoom.
         */
        zoom: function(newRoot, p) {

            var self = this;

            if (document.documentElement.__transition__) return;

            // Rescale outside angles to match the new layout.
            var enterArc,
                exitArc,
                outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

            function insideArc(d) {
                return p.key > d.key
                    ? {depth: d.depth - 1, x: 0, dx: 0} : p.key < d.key
                    ? {depth: d.depth - 1, x: 2 * Math.PI, dx: 0}
                    : {depth: 0, x: 0, dx: 2 * Math.PI};
            }

            function outsideArc(d) {
                return {
                    depth: d.depth + 1, 
                    x: outsideAngle(d.x), 
                    dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)
                    };
            }

            function arcTween(b) {
                var i = d3.interpolate(this._current, b);
                this._current = i(0);
                return function(t) {
                    return self.arc(i(t));
                };
            }

            self.center.datum(newRoot);
            //console.log("newRoot");
            //console.log(newRoot);

            // When zooming in, 
            // arcs enter from the outside and exit to the inside.
            // Entering outside arcs start from the old layout.
            if (newRoot === p) {
                enterArc = outsideArc;
                exitArc = insideArc;
                outsideAngle.range([p.x, p.x + p.dx]);
            }

            self.path = self.path.data(self.partition.nodes(newRoot)
                                       .slice(1), function(d) { 
                                           return d.key; 
                                       });

            // When zooming out, 
            // arcs enter from the inside and exit to the outside.
            // Exiting outside arcs transition to the new layout.
            if (newRoot !== p) {
                enterArc = insideArc;
                exitArc = outsideArc;
                outsideAngle.range([p.x, p.x + p.dx]);
            }

            d3.transition()
              .duration(d3.event.altKey ? 7500 : 750)
              .each(function() {
                  self.path.exit().transition()
                      .style("fill-opacity", function(d) { 
                          return d.depth === 1 + (newRoot === p) ? 
                                 1 : 0;
                      })
                      .attrTween("d", function(d) { 
                          return arcTween.call(this, exitArc(d));
                      })
                      .remove();

                  self.path.enter().append("path")
                      .style("fill-opacity", function(d) { 
                          return d.depth === 2 - (newRoot === p) ? 
                                 1 : 0;
                      })
                      .style("fill", function(d) { 
                          return d.fill; 
                      })
                      .on("click", function(d, i) {
                          self.zoomIn(d);
                      })
                      .each(function(d) { 
                          this._current = enterArc(d);
                      });
                  // add the tooltip
                  self.path.append("title")
                      .text(function(d) {
                          return d.name + "\n" + 
                                 self.formatNumber(d.value) + 
                                 " Pageviews\n" +
                                 self.formatPercentage(d.value / self.totalValue) + 
                                 " of total pageviews";
                      });

                  self.path.transition()
                      .style("fill-opacity", 1)
                      .attrTween("d", function(d) { 
                          return arcTween.call(this, 
                                                self.updateArc(d)); 
                      });
              });
        },

        /**
         * the generic rull to get ready the id.
         * using the self.attrId as the prefix for the given name.
         */
        getGenericId: function(name) {

            var self = this;
            return self.attrId + '-' + name;
        },
        
        key: function(d) {

            var k = [], p = d;
            while (p.depth) k.push(p.name), p = p.parent;
            return k.reverse().join(".");
        },

        fill: function(d) {

            var self = this;

            var p = d;
            //console.log(p);
            // set the leaf to use the parent's color.
            while (p.depth > 1) p = p.parent;
            var c = d3.lab(self.hue(p.name));
            c.l = self.luminance(d.sum);

            return c;
        },

        updateArc: function(d) {

            return {depth: d.depth, x: d.x, dx: d.dx};
        }
    });

})(jQuery);
