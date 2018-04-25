/**
 * create the jQuery plugin zoomableCircles, it will be very simple
 * to use:
 *
 *  jQuery('circle-div-id').zoomableCircles(options, data);
 */

;(function($) {

    // set the plugin name zoomableCircles.
    var pluginName = 'zoomableCircles';
    // set the default options.
    var defaultOptions = {
        "colorRange" : ["hsl(199,80%,80%)", "hsl(228,30%,40%)"],
        "leafFill" : "white",
        "imgRatio" : 1,
        "diameter" : 500,
        "margin" : 20
    };

    /**
     * the constructor for zoomableCircles plugin.
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

            //process the JSON data.
            // get the circle data from the data source.
            // check if the data source has different format.
            self.circleData = "data" in self.jsonData ?
                self.jsonData.data : self.jsonData;
            // the attributes in jsonData will overwrite options.
            if('attributes' in self.jsonData) {

                // the values in attributes will overwrite 
                // the same key in options. and the result will
                // store in options.
                $.extend(self.options, self.jsonData.attributes);
            }

            // draw circles.
            self.drawCircles();
        },
        
        /**
         * test reload.
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
         * the function to draw all circles.
         */
        drawCircles: function() {

            var self = this;
            var $element = $(self.element);

            // TODO: how to visually show the color range?
            // map domain -1 to 5 to color range of hsl(152,80%,80%) 
            // to hsl(228,30%,40%)
            //var color = d3.scale.linear()
            //    .domain([-1, 2])
            //    .range(self.options.colorRange)
            //    .interpolate(d3.interpolateHcl);
            // this is another solution to set the color range for
            // the background color.
            var color = function(depth) {

                // depth -1 will be the background,
                var index = depth < 0 ? 0 : depth;
                // to make sure it is not exceed the color range.
                if(index > self.options.colorRange.length - 1) {
                    index = self.options.colorRange.length - 1;
                }

                return self.options.colorRange[index];
            };

            // TODO: What's pack layout?
            // make pack layout for hierarchal layouts in D3, 
            // (circles within circles)
            var packSize = self.options.diameter - 
                           self.options.margin;
            var pack = d3.layout.pack()
                .padding(2)
                .size([packSize, packSize])
                .value(function(d) { return d.size; })

            // append <g> to <svg> to the <body>
            // crate the container circle as SVG element.
            var selector = "#" + self.attrId;
            self.svg = d3.select(selector).append("svg")
                .attr("width", self.options.diameter)
                .attr("height", self.options.diameter)
                .style("margin", "auto")
                .style("display", "block")
                .append("g")
                .attr("transform", 
                      "translate(" + self.options.diameter / 2 + 
                      "," + self.options.diameter / 2 + ")");

            // request JSON file and process its data (root variable)
            //d3.json(dataFile, function(error, root) {
            //    if (error) return console.error(error);

            // process JSON data in pack layout to 
            // get positions of each node
            var root = self.circleData;
            self.focus = root;
            // TODO: pack nodes function?
            self.nodes = pack.nodes(root);
            console.log(self.nodes);
            self.view = [];

            // selectAll says "map nodes[] to <circle>"; 
            // create <circle> for <g>
            self.circle = self.svg.selectAll("circle")
                .data(self.nodes)
                // .enter() binds new data to new element 
                // (<circle> in this case)
                .enter().append("circle")
                .attr("class", function(d) {
                    return d.parent ? d.children ? "node" : 
                           "node node--leaf" : "node node--root"; 
                })
                .style("fill", function(d) {

                    if (d.children) {
                        // if ccurrent node has children, 
                        // we will set the filling color based on 
                        // the calculation result from color range.
                        return color(d.depth);
                    } else {
                        // return the fill color for leaf.
                        return 'leafFill' in d ? d.leafFill : 
                            self.options.leafFill;
                    }
                })
                .on("click", function(d) {

                    if (self.focus !== d) {
                        self.zoom(d);
                        d3.event.stopPropagation();
                    }
                });

            // create <symbol> to hold <image> for use 
            // with <use> later
            self.svg.selectAll("symbol")
                .data(self.nodes)
                .enter().append("symbol")
                .attr("id", function(d, i) {
                    return self.attrId + "-img-" + i; 
                })
                // 'viewBox' to ensure entire image 
                // shows in different circle size
                .attr("viewBox", function(d) {
                      // viewBox sized to display entire image 
                      // in fixed size parent svg
                      var w = d.imgWidth ? d.imgWidth : 100;
                      var h = d.imgHeight ? d.imgHeight : 100;
                      return "0 0 " + w + " " + h;
                })
                .attr("preserveAspectRatio", "xMaxYMax meet")
                .append("image")
                .attr("xlink:href", function(d) {
                    return d.imgUrl ? d.imgUrl : null;
                })
                .attr("height", "100%")
                .attr("width", "100%");

            // display <symbol> using <use> 
            // (this way the chart works in chrome/IE)
            var image = self.svg.selectAll("use")
                .data(self.nodes)
                .enter().append("use")
                .attr("xlink:href", function(d, i) {
                    return "#" + self.attrId + "-img-" + i; 
                });

            // add <text> (the category labels)
            var text = self.svg.selectAll("text")
                .data(self.nodes)
                .enter().append("text")
                .attr("class", "label")
                .style("fill-opacity", function(d) {
                    return d.parent === root ? 1 : 0;
                })
                .style("display", function(d) {
                    return d.parent === root ? null : "none";
                })
                .text(function(d) { return d.name; });

            // to move <circle>, <text>, <use> 
            // according to zoom (active circle)
            self.node = self.svg.selectAll("circle,text,use");

            d3.select(selector)
                // update background color.
                .style("background", color(-1))
                .on("click", function() { 
                    self.zoom(root); 
                });

            self.zoomTo([root.x, root.y, 
                         root.r * 2 + self.options.margin]);
        },

        /**
         * a function responsible for zooming in on circles
         */
        zoom: function(d) {

            var self = this;

            $('#circle-info').html(d.name);
            console.log(d);

            var focus0 = self.focus; 
            self.focus = d;

            var transition = d3.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween("zoom", function(d) {
                    var i = d3.interpolateZoom(self.view, 
                             [self.focus.x, self.focus.y, 
                              self.focus.r * 2 + self.options.margin]);
                    return function(t) {
                        self.zoomTo(i(t));
                    };
                });

            transition.selectAll("text")
                .filter(function(d) {
                    return d.parent === self.focus ||
                           this.style.display === "inline" ||
                           d.parent === focus0;
                })
                .style("fill-opacity", function(d) {
                    return d.parent === self.focus ? 1 : 0.5;
                })
                .each("start", function(d) {
                    if (d.parent === self.focus) 
                        this.style.display = "inline";
                })
                .each("end", function(d) {
                    if (d.parent !== self.focus) 
                        this.style.display = "none";
                });

            // logos are opaque at root level only
            transition.selectAll("use")
                .style("opacity", function(d) {
                    return self.focus.depth === 0 ? 1 : 0.8;
                });
        },

        /**
         */
        zoomTo: function(v) {

            var self = this;

            var k = self.options.diameter / v[2]; 
            // view is global variable here.
            self.view = v;

            self.node.attr("transform", function(d) {
                return "translate(" + (d.x - v[0]) * k + "," + 
                       (d.y - v[1]) * k + ")";
            });
            self.circle.attr("r", function(d) {
                return d.r * k;
            });

            self.svg.selectAll("use")
                .attr("width", function(d) { 

                    var ratio = d.imgRatio ? d.imgRatio : 
                                             self.options.imgRatio;
                    return d.r * k * ratio; 
                })
                .attr("height", function(d) {

                    var ratio = d.imgRatio ? d.imgRatio : 
                                             self.options.imgRatio;
                    return d.r * k * ratio; 
                });

            var transformInfo;
            // get all <use> and for each move it to <circle> centre
            self.svg.selectAll("use").each(function(d, i) {
                // get current transform info and 
                // translate it to circle centre
                transformInfo = 
                    d3.transform(d3.select(this).attr("transform"));
                var height = d3.select(this).attr("height");
                var width = d3.select(this).attr("width");
                var x = transformInfo.translate[0] - (width / 2);
                var y = transformInfo.translate[1] - (height / 2);
                // set new transform translation
                d3.select(this)
                    .attr("transform", function(d) {
                        return "translate(" + x.toString() + "," + 
                               y.toString() +")";
                    });
            });

            // get all <text> and for each 
            // move it to <circle> centre
            self.svg.selectAll("text").each(function(d, i) {
                // get current transform info and 
                // translate it to circle centre
                //console.log(this);
                var transformInfo = 
                    d3.transform(d3.select(this).attr("transform"));
                //var parentTransform = 
                // d3.transform(d3.select(this.parent).attr("transform"));
                //if(d.name === 'Ubuntu') {
                //    // d.r is the radius of the circle, 
                //    // half of the diameter
                //    console.log("max=" + d.r * 2 * k);
                //    // if d.r * 2 * k > diameter / 2,
                //    // that's the moment, when the solo 
                //    // circle is show up.
                //    console.log(self.view);
                //    console.log(i);
                //    console.log("k=" + k);
                //}

                var height = d3.select(this).attr("height");
                var width = d3.select(this).attr("width");
                var x = transformInfo.translate[0] - (width / 2);
                //var y = transformInfo.translate[1] - 
                //    (height / 2) - parentTransform.translate[1];
                var y = transformInfo.translate[1] + 
                        ((d.r * k) / 1.5);
                //var y = - 20.0 - (height / 2);
                // set new transform translation
                d3.select(this)
                    .attr("transform", function(d) {
                        return "translate("+ x.toString() + "," + 
                               y.toString() +")";
                    });
            });
        }
    });

})(jQuery);

