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
        "diameter" : 500,
        "margin" : 10
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
            self.attrId = $element.attr('id');
            $element.html("I am sunburst! I am comming up now...");
            self.draw();
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
         * start drawing.
         */
        draw: function() {

            var self = this;


            // get ready the svg.
            var bsId = Math.ceil((Math.random() * 100 + 100));
            var bsSvgId = 'svgid-' + bsId;
            self.svg = d3.select('#' + self.attrId).append("svg")
                .attr("id", bsSvgId)
                //.attr("width", margin.left + margin.right)
                .attr('width', self.options.diameter)
                //.attr("height", margin.top + margin.bottom)
                .attr('height', self.options.diameter)
              .append("g")
                .attr("transform", 
                       "translate(" + self.options.diameter/ 2 + 
                       "," + self.options.diameter/ 2 + ")");

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
            console.log(root);
            // after comupte, the root value will be the total value.
            self.totalValue = root.value;

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
                .on("click", function() {
                    self.zoomOut(this);
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
                .on("click", function() {
                    self.zoomIn(this);
                });
            // add the tooltip
            self.path.append("title")
                .text(function(d) {
                    return d.name + "\n" + 
                       //formatNumber(d.value) + " Pageviews\n" +
                       //Math.round10((d.value / bsTotal) * 100, -2) + 
                       "% of total pageviews";
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
            //$("#pageviews-" + bsId).text(formatNumber(p.value));
            //$("#group-" + bsId).text(p.name);
            //var percentage = 
            //    Math.round10(p.value / bsTotal * 100, -2);
            //$("#percentage-" + bsId).text(percentage + "%");

            self.zoom(p, p);
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
            //$("#pageviews-" + bsId).text(formatNumber(p.parent.sum));
            //$("#group-" + bsId).text(p.parent.name);
            //var percentage = 
            //    Math.round10(p.parent.sum/ bsTotal * 100, -2);
            //$("#percentage-" + bsId).text(percentage + "%");

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
                return {depth: d.depth + 1, x: outsideAngle(d.x), dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)};
            }

            self.center.datum(newRoot);

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
                      .on("click", function() {
                          self.zoomIn(this);
                      })
                      .each(function(d) { 
                          this._current = enterArc(d);
                      });
                  // add the tooltip
                  self.path.append("title")
                      .text(function(d) {
                          return d.name + "\n" + 
                                 //formatNumber(d.value) + " Pageviews\n" +
                                 //Math.round10((d.value / bsTotal) * 100, -2) + 
                                 "% of total pageviews";
                      });

                  self.path.transition()
                      .style("fill-opacity", 1)
                      .attrTween("d", function(d) { 
                          return self.arcTween.call(this, 
                                                self.updateArc(d)); 
                      });
              });
        },

        key: function(d) {

            var k = [], p = d;
            while (p.depth) k.push(p.name), p = p.parent;
            return k.reverse().join(".");
        },
        
        fill: function(d) {

            // get ready colors.
            var hue = d3.scale.category20c();
            var luminance = d3.scale.sqrt()
                .domain([0, 1e6])
                .clamp(true)
                .range([90, 20]);

            var p = d;
            //console.log(p);
            // set the leaf to use the parent's color.
            //while (p.depth > 1) p = p.parent;
            var c = d3.lab(hue(p.name));
            c.l = luminance(d.sum);

            return c;
        },

        updateArc: function(d) {
            return {depth: d.depth, x: d.x, dx: d.dx};
        },

        arcTween: function(b) {

            var i = d3.interpolate(this._current, b);
            this._current = i(0);
            return function(t) {
                return self.arc(i(t));
            };
        }
    });

})(jQuery);
