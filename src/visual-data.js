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
        /**
         * group rules.
         */
        groupRules: [
          ["^/(mnr|natural)", "MNRF"], 
          ["^/(fin|rev|stevecheng)", "MOF"], 
          ["^/(mgcs|serviceontario|diversity|mgs)", "MGCS"], 
          ["^/(omafra|OMAFRA|digitalomafra|debstark|gregmeredith)", "OMAFRA"], 
          ["^/mag", "MAG"], 
          ["^/(moh|majamilosevic)", "MOHLTC"], 
          ["^/(mcscs|MCSCS)", "MCSCS"], 
          ["^/(mcys|nancymatthews)", "MCYS"], 
          ["^/mcss", "MCSS"], 
          ["^/(labour|sophiedennis)", "MOL"],
          ["^/mci", "MCI"],
          ["^/mah", "MAH"],
          ["^/mirr", "MIRR"],
          ["^/(lrc|gis)", "LRC"],
          ["^/(tbs|openon|greenoffice)", "TBS"], 
          ["^/(cyssc)", "CYSSC"], 
          ["^/(cac)", "CAC"], 
          ["^/(tcu)", "TCU-ETD"],
          ["^/(iit|IIT)", "IIT"], 
          ["^/(its|ITS)", "ITS"], 
          ["^/(groups)", "Groups"],
          ["^/(mds)", "MDS"],
          ["^/(wiki)", "Wiki"],
          ["^/(customsearch|solrsearch)", "OPSpedia Search"],
          ["^/(topical)", "Topical"],
          ["^/(tops|webcomm)", "Programs"]
        ]
    };

    /**
     * the constructor for bilevelSunburst plugin.
     * assume jsonData has the following structure.
     * 
     *   [
     *     ["/fin/", 4011, 5978],
     *     ["/mcys/", 2774, 4130],
     *     ["/its/", 1345, 3406]
     *   ]
     *
     * It is similar to the csv format.
     *
     * TODO: we shouls support csv format too.
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
            self.analyzeData();
            // TODO: process data:
            //  - rule to group! generate the tree map data.
            //  - set up the sunburst data structure.
            //  - calculate sub total, total
            //  - sorting the data, group
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
         * the entry point to analyze data.
         *
         * TODO: allow user to customize the data analysis.
         */
        analyzeData: function() {

            var self = this;
            self.gaDataAnalyst(self.jsonData, 
                               self.options.groupRules);
        },

        /**
         * Google Analytics data analyst.
         * here is the data structure:
         *  - all
         *    - group one (MOF)
         *      - site one (fin)
         *        - page one
         *        - page two
         *      - site two (revenue)
         *    - group two (MNRF)
         *      - site one (naturalresources)
         *
         * strategy to order group by total group pageviews.
         * 
         * 1. create a groupsInOrder arrry, with structure:
         *    [groupname, totalPageviews]
         * 2. order the group after 
         */
        gaDataAnalyst: function(theData, theRules) {

            var self = this;
            var formatNumber = d3.format(',d');

            self.groups = {}; // decide by group rules.
            self.groupsPageviews = {};
            //var groupsSessions = {};
            self.totalSessions = 0;
            self.pagesSummary = [];
            // [pageviews, pages, sites, sessions]
            self.total = [0,0,0,0];

            // analyze data is basically walk through it.
            for(var i = 0; i < theData.length; i++) {
                // Assume the GA data will have structure:
                // [page_path, sessions, pagevies]
                var pagePath = theData[i][0];
                var pageSessions = theData[i][1];
                var pagePageviews = theData[i][2];

                // find the site for this page page path
                //var pattern = /^\/(.*)\//;
                var pattern = /^\/([a-z0-9\-]*)\//;
                // default path.
                var site = '/';
                var result = pattern.exec(pagePath);
                if(result != null) {
                    // find some match.
                    site = result[1];
                }

                // find the group and site for this page path.
                // set the default group.
                var group = 'Other Sites';
                for(var n = 0; n < theRules.length; n++) {
                    var condition = RegExp(theRules[n][0]);
                    if(condition.test(pagePath)) {
                        // find match, assign the group
                        group = theRules[n][1];
                        break;
                    }
                }

                // the groups will have the following structure:
                // {
                //   groupOne: {
                //     siteOne: [
                //       [path, pageview, session],
                //       [pathone, pageview, session],
                //     ],
                //     siteTwo: [
                //       [path, pageview, session],
                //       [pathone, pageview, session],
                //     ]
                //   }
                // }
                if(Object.keys(self.groups).indexOf(group) < 0) {
                    // create the new group.
                    self.groups[group] = {};
                    self.groupsPageviews[group] = {};
                    // track the total pageviews for a group.
                    self.groupsPageviews[group]['groupPageviews'] = 0;
                }
                // using the site as the key.
                if(Object.keys(self.groups[group]).indexOf(site) < 0) {
                    // create the new site.
                    self.groups[group][site] = [];
                }

                // each page path
                var page = {
                  "name": pagePath,
                  "size": pagePageviews,
                };
                // push page to site.
                self.groups[group][site].push(page);
                // add the page pageviews to group pageviews.
                self.groupsPageviews[group]['groupPageviews'] += 
                    pagePageviews;
                // sumamry for top 10 pages.
                if(i < 10) {
                    // get ready the href link for page.
                    var pageUrl = pagePath.substring(0,8);
                    pageUrl = pagePath.length > 8 ? 
                              pageUrl + "..." : pageUrl;
                    pageUrl = '<a href="http://intra.net.gov.on.ca' +
                       pagePath + '" title="' + pagePath + '">' + 
                       pageUrl + '</a>';
                    var summary = 
                        '<tr>' +
                        '<td>' + pageUrl + '</td>' +
                        '<td>' + formatNumber(pagePageviews) +
                        '</td><td>' + group + '</td>' +
                        '</tr>';
                    self.pagesSummary.push(summary);
                }
                self.total[3] += pageSessions;
            }

            // try to sort the groups by group pageviews.
            var groupsInOrder = [];
            for(var group in self.groupsPageviews) {
                groupsInOrder.push([group, 
                                    self.groupsPageviews[group]["groupPageviews"]]);
            }
            //console.log(groupsInOrder);
            groupsInOrder = groupsInOrder.sort(function(a, b) {
                return b[1] - a[1];
            });

            // the name, children structure.
            self.groupsTreemap = [];
            self.groupsSummary = [];
            for(var i = 0; i < groupsInOrder.length; i ++) {

                var group = groupsInOrder[i][0];
                var sites = self.groups[group];

                // variables for summary:
                var totalPageviews = groupsInOrder[i][1];
                var totalSites = Object.keys(sites).length;
                var totalPages = 0;

                // the name, children structure.
                var groupChildren = [];
                for(var site in sites) {
                    var pages = sites[site];
                    totalPages = totalPages + pages.length;
                    var eachSite = {
                      "name": site,
                      "children": pages
                    };
                    groupChildren.push(eachSite);
                }

                // if the group only have one child.
                var children = groupChildren;
                if(groupChildren.length == 1) {
                    children = groupChildren[0]["children"];
                }
                var eachGroup = {
                  "name": group,
                  "children": children
                };
                self.groupsTreemap.push(eachGroup);

                // build the groups summary.
                //var summary = buildListGroupItem(group, totalSites, 
                var summary = self.buildTableRow(group, totalSites, 
                                                 totalPages, 
                                                 totalPageviews);
                self.groupsSummary.push(summary);
                // calculate total.
                self.total[0] += totalPageviews;
                self.total[1] += totalPages;
                self.total[2] += totalSites;
            }

            // get ready the tree map data.
            self.treemapData = {
                "name": "All Traffic",
                "children": self.groupsTreemap
            };
        },

        /**
         * build the dashboard as media object.
         *
         * build the chart, using corresponding jQuery plugins
         * create the summary
         *
         */
        buildDashboard: function() {

            var self = this;

            var media =
'<div class="media">' +
'  <div class="media-left">' +
// the visual chart as media-object.
'    <div class="media-object" id="' +
      self.options.chartId + '">Charts</div>' +
'  </div>' +
'  <div class="media-body">' +
'    <div id="' + self.options.summaryId + '">Summary</div>' +
'  </div>' +
'</div>';

            $('#' + self.attrId).html(media);

            // Draw the chart,
            $('#' + self.options.chartId).html('')
              .bilevelSunburst({date: "2017-03-12"},
                               self.treemapData);
            // create the summary and
        },

        /**
         * build the panel as dashboard.
         * Where is data from?
         * 
         * build the chart, using corresponding jQuery plugins
         * create the summary
         *
         * FIXME: panel class NOT working well with z-index.
         * panel class seems overlap the z-index most time.
         */
        buildDashboardPanel: function() {

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
              .bilevelSunburst({date: "2017-03-12"}, 
                               self.treemapData);
            // create the summary and 
        },

        /**
         * build row for each table..
         *
         * <tr>
         *   <td>MOF</td>
         *   <td>2089</td>
         *   <td>345</td>
         * </tr>
         */
        buildTableRow: function(groupName, totalSites, totalPages,
                                totalPageviews) {
            var format = d3.format(',d');
            // build
            var summary = 
              '<tr>' +
              '<td>' + groupName + '</td>' +
              '<td>' + format(totalPageviews) + '</td>' +
              '<td>' + format(totalPages) + '</td>' +
              //'<td>' + totalSites + '</td>' +
              '</tr>';

            return summary;
        }
    });

})(jQuery);
