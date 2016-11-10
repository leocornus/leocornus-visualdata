/** 
 * Creates a zoomable circle chart based on data within a provided JSON file.
 * 
 * @param {number} margin is the size of the space between the <svg> tag and the 
 * edge of the root circle.
 * @param {number} diameter is the diameter of the root circle in pixels
 * @param {string} dataFile is the path to the JSON file containing data to be 
 * populated in the chart
 */
function circleChart(selector, margin, diameter, jsonData) {

    // get the circle data from the data source.
    // check if the data source has different format.
    var circleData = 'data' in jsonData ? jsonData.data : jsonData;
    // set default value for global attributes.
    var colorRange = ["hsl(199,80%,80%)", "hsl(228,30%,40%)"];
    // the color for leaf fill background. default is white.
    var leafFill = "white";
    // the default image ratio.
    var imgRatio = 1;
    if ('attributes' in jsonData) {
        colorRange = 'colorRange' in jsonData.attributes ?
                     jsonData.attributes.colorRange : colorRange;
        leafFill = 'leafFill' in jsonData.attributes ?
                   jsonData.attributes.leafFill : leafFill;
        imgRatio = 'imgRatio' in jsonData.attributes ?
                   jsonData.attributes.imgRatio : imgRatio;
    }

    // TODO: how to visually show the color range?
    // map domain -1 to 5 to color range of hsl(152,80%,80%) 
    // to hsl(228,30%,40%)
    var color = d3.scale.linear()
        .domain([-1, 5])
        .range(colorRange)
        .interpolate(d3.interpolateHcl);

    // TODO: What's pack layout?
    // make pack layout for hierarchal layouts in D3, 
    // (circles within circles)
    var pack = d3.layout.pack()
        .padding(2)
        .size([diameter - margin, diameter - margin])
        .value(function(d) { return d.size; })

    // append <g> to <svg> to the <body>
    // crate the container circle as SVG element.
    var svg = d3.select(selector).append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .style("margin", "auto")
        .style("display", "block")
        .append("g")
        .attr("transform", 
              "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    // request JSON file and process its data (root variable)
    //d3.json(dataFile, function(error, root) {
    //    if (error) return console.error(error);

    // process JSON data in pack layout to 
    // get positions of each node
    var root = circleData;
    var focus = root;
    // TODO: pack nodes function?
    var nodes = pack.nodes(root);
    var view;

    // selectAll says "map nodes[] to <circle>"; 
    // create <circle> for <g>
    var circle = svg.selectAll("circle")
        .data(nodes)
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
                return 'leafFill' in d ? d.leafFill : leafFill;
            }
        })
        .on("click", function(d) {
            if (focus !== d) zoom(d), d3.event.stopPropagation();
        });

    // create <symbol> to hold <image> for use with <use> later
    svg.selectAll("symbol")
        .data(nodes)
        .enter().append("symbol")
        .attr("id", function(d, i) {
            return "img-" + i; 
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
    var image = svg.selectAll("use")
        .data(nodes)
        .enter().append("use")
        .attr("xlink:href", function(d, i) {
            return "#img-" + i; 
        });

    // add <text> (the category labels)
    var text = svg.selectAll("text")
        .data(nodes)
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
    var node = svg.selectAll("circle,text,use");

    d3.select(selector)
        // update background color.
        .style("background", color(-1))
        .on("click", function() { zoom(root); });

    zoomTo([root.x, root.y, root.r * 2 + margin]);
    d3.select(self.frameElement).style("height", diameter + "px");

    /**
     * a function responsible for zooming in on circles
     */
    function zoom(d) {

        var focus0 = focus; focus = d;

        var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function(d) {
                var i = d3.interpolateZoom(view, 
                         [focus.x, focus.y, focus.r * 2 + margin]);
                return function(t) {
                    zoomTo(i(t));
                };
            });

        transition.selectAll("text")
            .filter(function(d) {
                return d.parent === focus ||
                       this.style.display === "inline" ||
                       d.parent === focus0;
            })
            .style("fill-opacity", function(d) {
                return d.parent === focus ? 1 : 0.5;
            })
            .each("start", function(d) {
                if (d.parent === focus) 
                    this.style.display = "inline";
            })
            .each("end", function(d) {
                if (d.parent !== focus) 
                    this.style.display = "none";
            });

        // logos are opaque at root level only
        transition.selectAll("use")
            .style("opacity", function(d) {
                return focus.depth === 0 ? 1 : 0.8;
            });
    }

    /**
     * a function responsible for zooming in on circles
     */
    function zoomTo(v) {

        var k = diameter / v[2]; 
        // view is global variable here.
        view = v;

        node.attr("transform", function(d) {
            return "translate(" + (d.x - v[0]) * k + "," + 
                   (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function(d) {
            return d.r * k;
        });

        svg.selectAll("use")
            .attr("width", function(d) { 

                var ratio = d.imgRatio ? d.imgRatio : imgRatio;
                return d.r * k * ratio; 
            })
            .attr("height", function(d) {

                var ratio = d.imgRatio ? d.imgRatio : imgRatio;
                return d.r * k * ratio; 
            });

        var transformInfo;
        // get all <use> and for each move it to <circle> centre
        svg.selectAll("use").each(function(d, i) {
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

        // get all <text> and for each move it to <circle> centre
        svg.selectAll("text").each(function(d, i) {
            // get current transform info and 
            // translate it to circle centre
            //console.log(this);
            var transformInfo = 
                d3.transform(d3.select(this).attr("transform"));
            //var parentTransform = 
            // d3.transform(d3.select(this.parent).attr("transform"));
            if(d.name === 'Ubuntu') {
                // d.r is the radius of the circle, half of the diameter
                console.log("max=" + d.r * 2 * k);
                // if d.r * 2 * k > diameter / 2,
                // that's the moment, when the solo circle is show up.
                console.log(view);
                console.log(i);
                console.log("k=" + k);
            }

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
}
