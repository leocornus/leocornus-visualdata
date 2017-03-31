// Closure
(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();

jQuery(document).ready(function($) {

/**
 * bs prefix stands for bilevel sunburst.
 * the interface should be:
 *   selector, width, height, date,
 */

//var margin = {top: 350, right: 480, bottom: 350, left: 480};
//var radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 10;
var bsDate = '2017-03-12';
var bsWidth = 600;
var bsHeight = 600;
var bsMargin = 10;
var bsRadius = Math.min(bsWidth / 2, bsHeight / 2) - bsMargin;
var bsSelector = '#preview';

var formatNumber = d3.format(",d");

var hue = d3.scale.category20c();

var luminance = d3.scale.sqrt()
    .domain([0, 1e6])
    .clamp(true)
    .range([90, 20]);

var bsId = Math.ceil((Math.random() * 100 + 100));
var bsSvgId = 'svgid-' + bsId;
var svg = d3.select(bsSelector).append("svg")
    .attr("id", bsSvgId)
    //.attr("width", margin.left + margin.right)
    .attr('width', bsWidth)
    //.attr("height", margin.top + margin.bottom)
    .attr('height', bsHeight)
  .append("g")
    .attr("transform", 
          "translate(" + bsWidth / 2 + "," + bsHeight / 2 + ")");

var bsExplanation = 
'<div id="explanation-' + bsId + '" + class="bs-explanation">' +
'  Day <span id="date-' + bsId + '" class="bs-date">2017-03-08</span><br/>' +
'  <span id="pageviews-' + bsId + '" class="bs-pageviews">40%</span><br/>' +
'  Pageviews - <span id="group-' + bsId + '" class="bs-group">All OPSpedia</span><br/>' +
'  <span id="percentage-' + bsId + '" class="bs-percentage">100%</span>' +
'</div>';
$('body').append(bsExplanation);

var partition = d3.layout.partition()
    .sort(function(a, b) { return d3.ascending(a.name, b.name); })
    .size([2 * Math.PI, bsRadius]);

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx ; })
    .padAngle(.01)
    .padRadius(bsRadius / 3)
    .innerRadius(function(d) { return bsRadius / 3 * d.depth; })
    .outerRadius(function(d) { return bsRadius / 3 * (d.depth + 1) - 1; });

// calculate the position for the explanation overlay.
// we need wait the svg is create.
var offset = $('#' + bsSvgId).offset();
var labelTop = offset['top'] + bsHeight / 2 - 50;
var labelLeft = offset['left'] + bsWidth / 2 - 90;
$('#explanation-' + bsId).css('left', labelLeft).css('top', labelTop);

d3.json("data/week-" + bsDate + "-sunburst.json", 
        function(error, root) {

  if (error) throw error;

  // Compute the initial layout on the entire tree to sum sizes.
  // Also compute the full name and fill color for each node,
  // and stash the children so they can be restored as we descend.
  partition
      .value(function(d) { return d.size; })
      .nodes(root)
      .forEach(function(d) {
        d._children = d.children;
        d.sum = d.value;
        d.key = key(d);
        d.fill = fill(d);
      });

  //console.log("root.value = " + root.value);
  // date only need set once.
  $("#date-" + bsId).text(bsDate);
  $("#pageviews-" + bsId).text(formatNumber(root.value));
  $("#group-" + bsId).text('All OPSpedia');
  var bsTotal = root.value;

  // Now redefine the value function to use the previously-computed sum.
  partition
      .children(function(d, depth) { return depth < 2 ? d._children : null; })
      .value(function(d) { return d.sum; });

  var center = svg.append("circle")
      .attr("r", bsRadius / 3)
      .on("click", zoomOut);

  center.append("title")
      //.text(function(d) {return d.name + "\n" + formatNumber(d.value);});
      .text("zoom out");

  var path = svg.selectAll("path")
      .data(partition.nodes(root).slice(1))
    .enter().append("path")
      .attr("d", arc)
      .style("fill", function(d) { return d.fill; })
      .each(function(d) { this._current = updateArc(d); })
      .on("click", zoomIn);
  // add the tooltip
  path.append("title")
      .text(function(d) {
          return d.name + "\n" + 
                 formatNumber(d.value) + " Pageviews\n" +
                 Math.round10((d.value / bsTotal) * 100, -2) + 
                 "% of total pageviews";
      });

  function zoomIn(p) {
    if (p.depth > 1) p = p.parent;
    if (!p.children) return;

    //console.log("zoom in p.value = " + p.value);
    //console.log("zoom in p.name = " + p.name);
    $("#pageviews-" + bsId).text(formatNumber(p.value));
    $("#group-" + bsId).text(p.name);
    var percentage = Math.round10(p.value / bsTotal * 100, -2);
    $("#percentage-" + bsId).text(percentage + "%");

    zoom(p, p);
  }

  function zoomOut(p) {
    if (!p) return;
    if (!p.parent) return;

    //console.log("zoom out p.value = " + p.parent.value);
    //console.log("zoom out p.name = " + p.parent.name);
    //console.log(p.parent);
    $("#pageviews-" + bsId).text(formatNumber(p.parent.sum));
    $("#group-" + bsId).text(p.parent.name);
    var percentage = Math.round10(p.parent.sum/ bsTotal * 100, -2);
    $("#percentage-" + bsId).text(percentage + "%");

    zoom(p.parent, p);
  }

  // Zoom to the specified new root.
  function zoom(root, p) {
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

    center.datum(root);

    // When zooming in, arcs enter from the outside and exit to the inside.
    // Entering outside arcs start from the old layout.
    if (root === p) enterArc = outsideArc, exitArc = insideArc, outsideAngle.range([p.x, p.x + p.dx]);

    path = path.data(partition.nodes(root).slice(1), function(d) { return d.key; });

    // When zooming out, arcs enter from the inside and exit to the outside.
    // Exiting outside arcs transition to the new layout.
    if (root !== p) enterArc = insideArc, exitArc = outsideArc, outsideAngle.range([p.x, p.x + p.dx]);

    d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function() {
      path.exit().transition()
          .style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
          .attrTween("d", function(d) { return arcTween.call(this, exitArc(d)); })
          .remove();

      path.enter().append("path")
          .style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
          .style("fill", function(d) { return d.fill; })
          .on("click", zoomIn)
          .each(function(d) { this._current = enterArc(d); });
  // add the tooltip
  path.append("title")
      .text(function(d) {
          return d.name + "\n" + 
                 formatNumber(d.value) + " Pageviews\n" +
                 Math.round10((d.value / bsTotal) * 100, -2) + 
                 "% of total pageviews";
      });

      path.transition()
          .style("fill-opacity", 1)
          .attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });
    });
  }
});

function key(d) {
  var k = [], p = d;
  while (p.depth) k.push(p.name), p = p.parent;
  return k.reverse().join(".");
}

function fill(d) {
  var p = d;
  //while (p.depth > 1) p = p.parent;
  var c = d3.lab(hue(p.name));
  c.l = luminance(d.sum);
  return c;
}

function arcTween(b) {
  var i = d3.interpolate(this._current, b);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  };
}

function updateArc(d) {
  return {depth: d.depth, x: d.x, dx: d.dx};
}

//d3.select(self.frameElement).style("height", margin.top + margin.bottom + "px");
d3.select(self.frameElement).style("height", bsHeight + "px");
});
