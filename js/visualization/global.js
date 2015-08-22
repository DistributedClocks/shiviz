/**
 * Constructs a Global. The constructor for this singleton should never be 
 * invoked directly.
 * 
 * @classdesc
 * 
 * A Global is the visualization in its entirety. It is a composition of
 * {@link View}s and is responsible for coordinating information that's shared
 * across Views. It is also responsible for drawing things shared across all
 * Views such as the list of hidden hosts
 * 
 * @constructor
 */
function Global($vizContainer, $sidebar, $hostBar, $logTable, views) {

    if (!!Global.instance) {
        throw new Exception("Global is a singleton - use getInstance() instead.");
    }

    /** @private */
    this.views = views.slice();

    /** @private */
    this.viewL = this.views.length > 0 ? this.views[0] : null;
    
    /** @private */
    this.viewR = this.views.length > 1 ? this.views[1] : null;

    /** @private */
    this.hostPermutation = null;

    /** @private */
    this.controller = new Controller(this);
    
    /** @private */
    this.$vizContainer = $vizContainer;
    
    /** @private */
    this.$sidebar = $sidebar;
    
    /** @private */
    this.$hostBar = $hostBar;

    /** @private */
    this.searchbar = SearchBar.getInstance();
    
    /** @private */
    this.$logTable = $logTable;
  
    /** @private */
    this.showDiff = false;

    /** @private */
    this.pairwiseView = false;

    this.$sidebar.css({
        width: Global.SIDE_BAR_WIDTH + "px"
    });
    
    var context = this;
    views.forEach(function(view) {
        view.controller = context.controller; //TODO
    });
    
}

/**
 * @static
 * @const
 */
Global.SIDE_BAR_WIDTH = 240;
/**
 * @static
 * @const
 */
Global.HOST_SIZE = 25;
/**
 * @static
 * @const
 */
Global.HIDDEN_EDGE_LENGTH = 40;

/**
 * @static
 * @const
 */
Global.MIN_HOST_WIDTH = 40;


/**
 * Redraws the global.
 */
Global.prototype.drawAll = function() {
    var global = this;
    var numViews = this.views.length;
    var searchbar = this.searchbar;
    this.resize();

    this.$logTable.empty(); //TODO: check
    this.$vizContainer.children("*").remove();
    this.$hostBar.children("*").remove();
    
    this.$vizContainer.height(global.getMaxViewHeight());
    var viewLabelDiv = $('<div id="viewLabelDiv"></div>');

    // Icons for left and right view, styled differently for labels and dropdowns
    var labelIconL = $('<label id="labelIconL"></label>').text("r").hide();
    var labelIconR = $('<label id="labelIconR"></label>').text("r").hide();
    var selectIconL = $('<label id="selectIconL"></label>').text("r").hide();
    var selectIconR = $('<label id="selectIconR"></label>').text("r").hide();

    var leftLabel = this.viewL.getLabel();
    var viewLabelL = $('<p id="viewLabelL"></p>').text(leftLabel).prepend(labelIconL);
    var viewSelectDiv = $('<div id="viewSelectDiv"></div>');
    var viewSelectL = $('<select id="viewSelectL"></select>');

    // Show arrow icons and highlight cluster results that match a search term when on the Clusters tab
    if ($(".leftTabLinks li").is(":visible") && $(".leftTabLinks li").last().hasClass("default")) {
        if ($("#clusterNumProcess").is(":checked") || ($("#clusterComparison").is(":checked")
            && $(".clusterBase").find("option:selected").text() != "Select a base execution")) {
            labelIconL.show(); selectIconL.show();

            if (global.getPairwiseView()) {
                labelIconR.show();
                selectIconR.show();
            }

            var baseDropdown = $(".clusterBase");
            var selected = $(".clusterBase option:selected");
            var mode = searchbar.getMode();

            // If the searchbar is not empty or in motif mode, fade out all executions in Clusters tab
            if (mode != SearchBar.MODE_EMPTY) {
                $("table.clusterResults a").filter(function() {
                    var text = $(this).text();
                    return text != "Show all" && text != "Condense";
                }).addClass("execFade");
                if (baseDropdown.is(":visible")) {
                    baseDropdown.addClass("fade");
                }

                // Remove fading for executions that match the search term
                this.views.forEach(function(view) {
                  if (view.hasQueryMatch()) {
                      var label = view.getLabel();
                      if (baseDropdown.is(":visible") && selected.val() == label) {
                          baseDropdown.removeClass("fade");
                      } else {
                        $("table.clusterResults a").filter(function() {
                            return $(this).attr("href") == label;
                        }).removeClass("execFade");
                      }
                  }
                });
            }
        }
    }

    if (this.viewR != null) {
        // the "Pairwise" button is only visible when there are > 1 executions and when not doing a motif search
        if (!$(".leftTabLinks li").first().next().hasClass("default") && searchbar.getMode() != SearchBar.MODE_MOTIF) {
            $(".pairwiseButton").show();
        }
        $(".searchTabLinks li").last().show();
        $(".visualization .left #tabs").css("height", "4.5em");

        var rightLabel = this.viewR.getLabel();
       // If there are only two executions in pairwise view, use labels instead of drop-downs
       if (numViews == 2 && global.getPairwiseView()) {
          this.$hostBar.append(viewLabelDiv);
          var viewLabelR = $('<p id="viewLabelR"></p>').text(rightLabel).append(labelIconR);
          viewLabelDiv.append(viewLabelL, viewLabelR);

       // Otherwise, use drop-downs
       } else {
            this.$hostBar.append(viewSelectDiv); 
            var viewSelectR = $('<select id="viewSelectR"></select>').hide();
            viewSelectDiv.append(selectIconL, selectIconR, viewSelectL);
            if (numViews != 2) {
                viewSelectDiv.append(viewSelectR);
            }
      
            this.views.forEach(function(view) {
               var label = view.getLabel();

               if (global.getPairwiseView()) {
                  if (label != rightLabel) {
                      viewSelectL.append('<option value="' + label + '">' + label + '</option>');
                  }
               // Include every view as an option for the left drop-down when not in pairwise view
               } else {
                    viewSelectL.append('<option value="' + label + '">' + label + '</option>');
               }
               if (label != leftLabel) {
                  viewSelectR.append('<option value="' + label + '">' + label + '</option>');
               }
            });
      
           viewSelectL.children("option[value='" + leftLabel + "']").prop("selected", true);
           viewSelectR.children("option[value='" + rightLabel + "']").prop("selected", true);
      
           viewSelectR.unbind().on("change", function(e) {
                var valR = $("#viewSelectR option:selected").val();
                var valL = $("#viewSelectL option:selected").val();
                global.controller.hideDiff();
                if (searchbar.getMode() == SearchBar.MODE_MOTIF) {
                    if (global.getController().hasHighlight()) {
                        searchbar.clearResults();
                    }
                    searchbar.resetMotifResults();
                }
                global.viewR = global.getViewByLabel(valR);
                if (global.getShowDiff()) {
                    global.controller.showDiff();
                } else {
                    global.drawAll();
                }
                // When clustering, draw cluster icons next to the execution dropdown or label
                if ($("#clusterNumProcess").is(":checked") || $("#clusterComparison").is(":checked")) {
                    global.drawClusterIcons();
                }
           });
       }          
    }
    // If there is a single execution
    else {
        // The label here is "" but it'll help shift the hostbar down
        this.$hostBar.append(viewLabelDiv); 
        viewLabelDiv.append(viewLabelL);
        $(".visualization .left #tabs").css("height", "2.5em");
    }

    viewSelectL.unbind().on("change", function(e) {
        var valR = $("#viewSelectR option:selected").val();
        var valL = $("#viewSelectL option:selected").val();
        global.controller.hideDiff();
        if (searchbar.getMode() == SearchBar.MODE_MOTIF) {
            if (global.getController().hasHighlight()) {
                searchbar.clearResults();
            }
            searchbar.resetMotifResults();
        }
        // If the selected view for viewL is the same as the current (hidden) viewR, change viewR to viewL so that
        // when a user changes to pairwise view, viewL and viewR are not the same (this leads to only one view being drawn)
        if (valL == global.viewR.getLabel()) {
            global.viewR = global.viewL;
        }
        global.viewL = global.getViewByLabel(valL);
        if (global.getShowDiff()) {
            global.controller.showDiff();
        } else {
            global.drawAll();
        }
        // When clustering, draw cluster icons next to the execution dropdown or label
        if ($("#clusterNumProcess").is(":checked") || $("#clusterComparison").is(":checked")) {
            global.drawClusterIcons();
        }
    });
    
    this.viewL.draw("L");
    this.$vizContainer.append(this.viewL.getSVG());
    this.$hostBar.append(this.viewL.getHostSVG());
    this.$logTable.append(this.viewL.getLogTable());
    this.controller.bindLines(this.viewL.getLogTable().find(".line:not(.more)"));
  
    if (this.getPairwiseView()) {
        $(".diffButton").show(); $("#viewSelectR").show();

        this.viewR.draw("R");
        // Draw the separator between the two views - this separator is only visible when
        // at least one process is present (not hidden) in both views
        if ((this.viewL.getTransformer().getHiddenHosts().length < this.viewL.getHosts().length) &&
           (this.viewR.getTransformer().getHiddenHosts().length < this.viewR.getHosts().length)) {
              var viewSeparator = $('<div id="viewSeparator"></div>');
              viewSeparator.css("height", global.getMaxViewHeight());
              this.$vizContainer.append(viewSeparator);
        }   
        this.$vizContainer.append(this.viewR.getSVG());
        this.$hostBar.append(this.viewR.getHostSVG());
        this.$logTable.append($("<td></td>").addClass("spacer"));
        this.$logTable.append(this.viewR.getLogTable());
        this.controller.bindLines(this.viewR.getLogTable().find(".line:not(.more)"));
    }

    this.$vizContainer.height("auto");
    $(".dialog").hide();
    $(".hostConstraintDialog").hide();
    this.drawSideBar();

    // only call countMotifs if there are actually highlighted motifs to count, 
    // otherwise the motifGroup parameter to addMotif() in motifNavigator is null
    if (this.getController().hasHighlightInView(this.viewL)) {
        searchbar.countMotifs();
    }
};

/**
  * This function returns the height of the view with the larger/taller visualModel
  * 
  * @returns {Number} the max height between the two active views
  */
Global.prototype.getMaxViewHeight = function() {
    this.viewL.getVisualModel().update();
    var maxHeight = this.viewL.getVisualModel().getHeight();
    if (this.viewR != null) {
        this.viewR.getVisualModel().update();
        maxHeight = Math.max(maxHeight, this.viewR.getVisualModel().getHeight());
    }
    return maxHeight;
}

/**
 * Gets the list of Views
 * 
 * @returns {Array<View>} The list of views
 */
Global.prototype.getViews = function() {
    return this.views.slice();
};

Global.prototype.getActiveViews = function() {
    var result = [this.viewL];
    if(this.viewR != null) {
        result.push(this.viewR);
    }
    return result;
};

Global.prototype.getViewByLabel = function(label) {
    for(var i = 0; i < this.views.length; i++) {
        var view = this.views[i];
        if(view.getLabel() == label) {
            return view;
        }
    }
    return null;
};

/**
 * Sets the host permutation
 * @param {HostPermutation} hostPermutation
 */
Global.prototype.setHostPermutation = function(hostPermutation) {
    this.hostPermutation = hostPermutation;
};

/**
 * Sets the showDiff boolean value
 * @param {Boolean} showDiff
 */
Global.prototype.setShowDiff = function(showDiff) {
    this.showDiff = showDiff;
}

/**
 * Gets the showDiff boolean value
 * @returns {Boolean} True if "Show Differences" was selected
 */
Global.prototype.getShowDiff = function() {
    return this.showDiff;
}

/**
 * Sets the pairwiseView boolean value

 * @param {Boolean} pairwiseView
 */
Global.prototype.setPairwiseView = function(pairwiseView) {
    this.pairwiseView = pairwiseView;
}

/**
 * Gets the pairwiseView boolean value
 * @returns {Boolean} True if "Pairwise" was selected
 */
Global.prototype.getPairwiseView = function() {
    return this.pairwiseView;
}

/**
  * Redraws the visualization with the two active views swapped
  */
Global.prototype.swapViews = function() {
    // This checks to see that there are indeed two views to swap
    if (this.viewL != null && this.viewR != null) {
        var viewL = this.viewL;
        this.viewL = this.viewR;
        this.viewR = viewL;
        this.drawAll();
        // When clustering, draw cluster icons next to the execution dropdown or label
        if ($("#clusterNumProcess").is(":checked") || $("#clusterComparison").is(":checked")) {
            this.drawClusterIcons();
        }
    }
}

/**
  * Sets the view in the given position to the execution with the label specified by anchorHref
  *
  * @param {String} position Either "L" or "R" to indicate the left or right view
  * @param {String} anchorHref The label of the execution to be set
  */
Global.prototype.setView = function(position, anchorHref) {
    var leftView = this.getActiveViews()[0].getLabel();
    var rightView = this.getActiveViews()[1].getLabel();

    if ((position == "L" && anchorHref == rightView) || (position == "R" && this.getPairwiseView() && anchorHref == leftView)) {
        this.swapViews();
    } else {
        // For logs with exactly two executions, there are no execution drop-downs so have to call drawClusterIcons directly
        if (this.getPairwiseView() && this.getViews().length == 2) {
            this.drawClusterIcons();
        } else {
            if (position == "L") {
                $("#viewSelectL").children("option[value='" + anchorHref + "']").prop("selected", true).change();
            } else {
                $("#viewSelectR").children("option[value='" + anchorHref + "']").prop("selected", true).change();                 
            }                
        }
    }
}

/**
 * Gets the {@link Controller}
 * @returns {Controller} The controller
 */
Global.prototype.getController = function() {
    return this.controller;
};

/**
 * Resizes the graph
 */
Global.prototype.resize = function() {
    
    var viewLNumHosts = getNumVisibleHosts(this.viewL.getHosts(), this.viewL.getTransformer().getSpecifiedHiddenHosts());
    
    var viewRNumHosts = 0;
    if (this.viewR != null && this.getPairwiseView()) {
        viewRNumHosts = getNumVisibleHosts(this.viewR.getHosts(), this.viewR.getTransformer().getSpecifiedHiddenHosts());
    }
    
    var visibleHosts = viewLNumHosts + viewRNumHosts;

    // TODO: rename to sidebarLeft sidebarRight middleWidth
    var headerWidth = $(".visualization header").outerWidth();
    var sidebarWidth = this.$sidebar.outerWidth();
    var globalWidth = $(window).width() - headerWidth - sidebarWidth;
    
    $("#searchbar").width(globalWidth);

    var widthPerHost = Math.max(Global.MIN_HOST_WIDTH, globalWidth / visibleHosts);
    var logTableWidth = this.viewR != null && this.getPairwiseView() ? (Global.SIDE_BAR_WIDTH - 12) / 2 : Global.SIDE_BAR_WIDTH;

    this.viewL.setWidth(viewLNumHosts * widthPerHost);
    this.viewL.setLogTableWidth(logTableWidth);
    
    if (this.viewR != null && this.getPairwiseView()) {
        this.viewR.setWidth(viewRNumHosts * widthPerHost);
        this.viewR.setLogTableWidth(logTableWidth);
    }
    
    var sel = d3.select("circle.sel").data()[0];
    if (sel) {
        var $svg = $(d3.select("circle.sel").node()).parents("svg");
        var $dialog = $(".dialog");
        if (sel.getX() > $svg.width() / 2)
            $dialog.css({
                "left": sel.getX() + $svg.offset().left + 40
            }).removeClass("right").addClass("left").show();
        else
            $dialog.css({
                "left": sel.getX() + $svg.offset().left - $dialog.width() - 40
            }).removeClass("left").addClass("right").show();
    }

    function getNumVisibleHosts(allHosts, hiddenHosts) {
        var hostSet = {};
        allHosts.forEach(function(host) {
            hostSet[host] = true;
        });
        
        hiddenHosts.forEach(function(host) {
            delete hostSet[host];
        });
        
        var count = 0;
        for(var key in hostSet) {
            count++;
        }
        
        return count;
    }
};

/**
  * Draws a normal, rectangular hidden host
  * 
  * @param {d3.selection} container The selection to append the new element to
  * @returns {d3.selection} The new selection containing the appended rectangle
  */
Global.prototype.drawHiddenHost = function(container) {
    var hiddenHost = container.append("rect");
    return hiddenHost;
}

/**
  * Draws a unique, diamond hidden host
  * 
  * @param {d3.selection} container The selection to append the new element to
  * @returns {d3.selection} The new selection containing the appended polygon
  */
Global.prototype.drawHiddenHostAsRhombus = function(container) {
    var hiddenHost = container.append("polygon");
    return hiddenHost;
}

/**
  * Draws arrow icons next to the base dropdown or next to execution labels in the Clusters tab.
  */
Global.prototype.drawClusterIcons = function() {
    $("#clusterIconL, #clusterIconR, br.spaceL, br.spaceR, br.left, br.right").remove();

    var leftLabel = this.viewL.getLabel();
    var rightLabel = this.viewR.getLabel();
    var clusterIconL = $('<label id="clusterIconL"></label>').text("r");
    var clusterIconR = $('<label id="clusterIconR"></label>').text("r");

    var leftLink = $("table.clusterResults a").filter(function() { return $(this).attr("href") == leftLabel; });
    var rightLink = $("table.clusterResults a").filter(function() { return $(this).attr("href") == rightLabel; });

    // Set margin for base dropdown to zero initially
    $(".clusterBase").removeClass("baseIndent");
    
    // If the selected execution is hidden in a condensed list, click the Show all button to make it visible
    if (!leftLink.is(":visible")) {
        $(leftLink.nextAll("a").filter(function() {
            return $(this).text() == "Show all";
        })[0]).click();
    }

    if (!rightLink.is(":visible") && this.getPairwiseView()) {
        $(rightLink.nextAll("a").filter(function() {
            return $(this).text() == "Show all";
        })[0]).click();
    }

    // If the left graph is the specified base execution, draw the left arrow icon next to the dropdown
    if ($("#clusterComparison").is(":checked")) {
        if (leftLabel == $("select.clusterBase").val()) {
            $("#baseLabel").after($("<br class='spaceL'>").hide());
            $(".clusterBase").before(clusterIconL.addClass("baseIcon")).addClass("baseIndent");
            if (this.getPairwiseView()) {
                $(rightLink.before(clusterIconR).next()).after($("<br class=right>").hide());;
            }
        // If the right graph is the specified base execution, draw the right arrow icon next to the dropdown
        } else if (this.getPairwiseView() && rightLabel == $("select.clusterBase").val()) {
            $("#baseLabel").after($("<br class='spaceR'>").hide());
            $(".clusterBase").before(clusterIconR.addClass("baseIcon")).addClass("baseIndent");
            $(leftLink.before(clusterIconL).next()).after($("<br class=left>").hide());
        }
    }
    // Otherwise, draw the appropriate arrow beside the correct execution label
    $(leftLink.before(clusterIconL).next()).after($("<br class=left>").hide());
    if (this.getPairwiseView()) {
        $(rightLink.before(clusterIconR).next()).after($("<br class=right>").hide());
    }
}

/**
 * Draws the hidden hosts, if any exist.
 * 
 * @private
 */
Global.prototype.drawSideBar = function() {
    
    var global = this;  
    this.$sidebar.children("#hiddenHosts").remove();
    this.$sidebar.children("#viewSelectDiv").remove();

    // Draw hidden hosts
    var hiddenHosts = {};
    this.viewL.getTransformer().getHiddenHosts().forEach(function(host) {
        hiddenHosts[host] = true;
    });
    
    if (this.viewR != null && this.getPairwiseView()) {
        this.viewR.getTransformer().getHiddenHosts().forEach(function(host) {
            hiddenHosts[host] = true;
        });
    }
  
    var hh = Object.keys(hiddenHosts);
    if (hh.length <= 0) {
        return;
    }

    this.$sidebar.append('<div id="hiddenHosts">Hidden processes:</div>');
    var hiddenHostsSelection = d3.select("#hiddenHosts");
    var hiddenHostsSVG = hiddenHostsSelection.append("svg");
  
    var hostsPerLine = Math.floor((Global.SIDE_BAR_WIDTH + 5) / (Global.HOST_SIZE + 5));
    hiddenHostsSVG.attr({
        "width": this.$sidebar.width(),
        "height": Math.ceil(hh.length / hostsPerLine) * (Global.HOST_SIZE + 5) - 5,
        "class": "hidden-hosts"
    });

    var hiddenHostsGroup = hiddenHostsSVG.append("g");
    hiddenHostsGroup.append("title").text("Double click to view");
  
    var first = true; var count = 0;
    // initial points for a unique host (ie. x and y coordinates for each corner of the rhombus shape)
    var x1 = 12; var y1 = 0; var x2 = 22; var y2 = 12;
    var x3 = 12; var y3 = 24; var x4 = 2; var y4 = 12;
    // initial x and y coordinates for a normal host
    var rectx = 0; var recty = 0; 
  
    hh.forEach(function(host) {
       var hiddenHost = global.drawHiddenHost(hiddenHostsSVG);  

      // If showDiff is true, check if this hidden host needs to be drawn as a rhombus
      if (global.getShowDiff()) {
          var uniqueHostsL = global.viewL.getTransformer().getUniqueHosts();
          //check if this hidden host is in the list of unique hosts for viewL     
          if (uniqueHostsL && uniqueHostsL.indexOf(host) != -1) {
              hiddenHost = global.drawHiddenHostAsRhombus(hiddenHostsSVG);
          }
          else if (global.viewR != null && global.getPairwiseView()) {
              //check if this hidden host is in the list of unique hosts for viewR
              var uniqueHostsR = global.viewR.getTransformer().getUniqueHosts();
              if (uniqueHostsR && uniqueHostsR.indexOf(host) != -1) {
                  hiddenHost = global.drawHiddenHostAsRhombus(hiddenHostsSVG);
              }
          }
      }
      
      hiddenHost.attr("width", Global.HOST_SIZE);
      hiddenHost.attr("height", Global.HOST_SIZE);
      hiddenHost.style("fill", global.hostPermutation.getHostColor(host));
      hiddenHost.append("title").text("Double click to view");

      // start over on a new line once the hidden hosts have taken up the side bar width
      if (count == hostsPerLine) { 
          if (global.getShowDiff()) {
            x1 = 12; y1 += Global.HOST_SIZE + 5; 
            x2 = 22; y2 += Global.HOST_SIZE + 5; 
            x3 = 12; y3 += Global.HOST_SIZE + 5; 
            x4 = 2; y4 += Global.HOST_SIZE + 5;
          }
          rectx = 0; recty += Global.HOST_SIZE + 5;
          first = true;
          count = 0;
      }

      // increment x coordinates so that the next hidden host will be drawn
      // next to the currently hidden hosts without any overlap
      if (!first) { 
          if (global.getShowDiff()) {
            x1 += Global.HOST_SIZE + 5;
            x2 += Global.HOST_SIZE + 5;
            x3 += Global.HOST_SIZE + 5;
            x4 += Global.HOST_SIZE + 5;
          }
          rectx += Global.HOST_SIZE + 5;    
      }
      first = false;
     
      // update attributes of the drawn node
      if (global.getShowDiff()) {
        var points = [x1,y1,x2,y2,x3,y3,x4,y4];
        hiddenHost.attr("points", points.join());
      }
      hiddenHost.attr("x", rectx);
      hiddenHost.attr("y", recty);
      count++;
     
      // bind the hidden host nodes to user input
      global.controller.bindHiddenHosts(host, hiddenHost);     
  });

};