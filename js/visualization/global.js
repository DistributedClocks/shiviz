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
    this.$logTable = $logTable;
	
    /** @private */
    this.showDiff = false;

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
    this.resize();

    this.$logTable.empty(); //TODO: check
    this.$vizContainer.children("*").remove();
    this.$hostBar.children("*").remove();
    
    this.$vizContainer.height(global.getMaxViewHeight());
	
    if (numViews > 2) {
		
        var viewSelectDiv = $('<div id="viewSelectDiv"></div>');
        this.$hostBar.append(viewSelectDiv);			
        var viewSelectL = $('<select id="viewSelectL"></select>');
        viewSelectDiv.append(viewSelectL);

        var viewSelectR = $('<select id="viewSelectR"></select>');
        viewSelectDiv.append(viewSelectR);
			
        this.views.forEach(function(view) {
            var label = view.getLabel();
				
            if (label != global.viewR.getLabel()) {
                viewSelectL.append('<option value="' + label + '">' + label + '</option>');
            }			
            if (label != global.viewL.getLabel()) {
                viewSelectR.append('<option value="' + label + '">' + label + '</option>');
            }
        });
			
        viewSelectL.children("option[value='" + this.viewL.getLabel() + "']").prop("selected", true);
        viewSelectR.children("option[value='" + this.viewR.getLabel() + "']").prop("selected", true);
			
        viewSelectL.unbind().on("change", function(e) {
            var val = $("#viewSelectL option:selected").val();
            global.controller.hideDiff();
            global.viewL = global.getViewByLabel(val);
            if (global.getShowDiff()) {
               global.controller.showDiff();
            }
            global.drawAll();
        });
			
        viewSelectR.unbind().on("change", function(e) {
			var val = $("#viewSelectR option:selected").val();
			global.controller.hideDiff()
			global.viewR = global.getViewByLabel(val);
			if (global.getShowDiff()) {
				global.controller.showDiff();
			}
			global.drawAll();
		});
	} else {
		
        var viewLabelDiv = $('<div id="viewLabelDiv"></div>');
        this.$hostBar.append(viewLabelDiv);	
        var viewLabelL = $('<p id="viewLabelL"></p>');
        viewLabelL.append(this.viewL.getLabel());
        viewLabelDiv.append(viewLabelL);

        if (numViews == 2) {
            var viewLabelR = $('<p id="viewLabelR"></p>');
            viewLabelR.append(this.viewR.getLabel());
            viewLabelDiv.append(viewLabelR);
        }
	}
    
    this.viewL.draw("L");
    $(".visualization .left #tabs").css("height", "2.5em");
    this.$vizContainer.append(this.viewL.getSVG());
    this.$hostBar.append(this.viewL.getHostSVG());
    this.$logTable.append(this.viewL.getLogTable());
    this.controller.bindLines(this.viewL.getLogTable().find(".line:not(.more)"));
	
    if (this.viewR != null) {
        // the "Show Differences" button is only visible when there are multiple executions
        $("#diff_button").show();
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
        $(".visualization .left #tabs").css("height", "4.5em");
    }
	
    this.$vizContainer.height("auto");

    $(".dialog").hide();

    this.drawSideBar();
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
    if(this.viewR != null) {
        viewRNumHosts = getNumVisibleHosts(this.viewR.getHosts(), this.viewR.getTransformer().getSpecifiedHiddenHosts());
    }
    
    var visibleHosts = viewLNumHosts + viewRNumHosts;

    // TODO: rename to sidebarLeft sidebarRight middleWidth
    var headerWidth = $(".visualization header").outerWidth();
    var sidebarWidth = this.$sidebar.outerWidth();
    var globalWidth = $(window).width() - headerWidth - sidebarWidth;
    
    $("#searchbar").width(globalWidth);

    var widthPerHost = Math.max(Global.MIN_HOST_WIDTH, globalWidth / visibleHosts);
    var logTableWidth = this.viewR == null ? Global.SIDE_BAR_WIDTH : (Global.SIDE_BAR_WIDTH - 12) / 2;

    this.viewL.setWidth(viewLNumHosts * widthPerHost);
    this.viewL.setLogTableWidth(logTableWidth);
    
    if(this.viewR != null) {
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
    
    if (this.viewR != null) {
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
          else if (global.viewR != null) {
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