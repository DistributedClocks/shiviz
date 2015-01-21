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
    this.view1 = this.views.length > 0 ? this.views[0] : null;
    
    /** @private */
    this.view2 = this.views.length > 1 ? this.views[1] : null;

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
Global.HOST_SQUARE_SIZE = 25;
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

    this.resize();

    this.$logTable.empty(); //TODO: check
    this.$vizContainer.children("*").remove();
    this.$hostBar.children("*").remove();
    
    this.view1.getVisualModel().update();
    var maxHeight = this.view1.getVisualModel().getHeight();
    
    if(this.view2 != null) {
        this.view2.getVisualModel().update();
        var maxHeight = Math.max(maxHeight, this.view2.getVisualModel().getHeight());
    }
    
    this.$vizContainer.height(maxHeight);

    this.view1.draw();
    this.$vizContainer.append(this.view1.getSVG());
    this.$hostBar.append(this.view1.getHostSVG());
    this.$logTable.append(this.view1.getLogTable());
    this.controller.bindLines(this.view1.getLogTable().find(".line:not(.more)"));
    
    if(this.view2 != null) {
        $("#diff_button").prop("disabled", false);
        this.view2.draw();
        this.$vizContainer.append(this.view2.getSVG());
        this.$hostBar.append(this.view2.getHostSVG());
        this.$logTable.append($("<td></td>").addClass("spacer"));
        this.$logTable.append(this.view2.getLogTable());
        this.controller.bindLines(this.view2.getLogTable().find(".line:not(.more)"));
    }
    
    this.$vizContainer.height("auto");

    $(".dialog").hide();

    this.drawSideBar();
};

/**
 * Gets the list of Views
 * 
 * @returns {Array<View>} The list of views
 */
Global.prototype.getViews = function() {
    return this.views.slice();
};

Global.prototype.getActiveViews = function() {
    var result = [this.view1];
    if(this.view2 != null) {
        result.push(this.view2);
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
    
    var view1NumHosts = getNumVisibleHosts(this.view1.getHosts(), this.view1.getTransformer().getSpecifiedHiddenHosts());
    
    var view2NumHosts = 0;
    if(this.view2 != null) {
        view2NumHosts = getNumVisibleHosts(this.view2.getHosts(), this.view2.getTransformer().getSpecifiedHiddenHosts());
    }
    
    var visibleHosts = view1NumHosts + view2NumHosts;

    // TODO: rename to sidebarLeft sidebarRight middleWidth
    var headerWidth = $(".visualization header").outerWidth();
    var sidebarWidth = this.$sidebar.outerWidth();
    var globalWidth = $(window).width() - headerWidth - sidebarWidth;
    
    $("#searchbar").width(globalWidth);

    var widthPerHost = Math.max(Global.MIN_HOST_WIDTH, globalWidth / visibleHosts);
    var logTableWidth = this.view2 == null ? Global.SIDE_BAR_WIDTH : (Global.SIDE_BAR_WIDTH - 12) / 2;

    this.view1.setWidth(view1NumHosts * widthPerHost);
    this.view1.setLogTableWidth(logTableWidth);
    
    if(this.view2 != null) {
        this.view2.setWidth(view2NumHosts * widthPerHost);
        this.view2.setLogTableWidth(logTableWidth);
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
 * Draws the hidden hosts, if any exist.
 * 
 * @private
 */
Global.prototype.drawSideBar = function() {
    
    var global = this;
    
    this.$sidebar.children("#hiddenHosts").remove();
    this.$sidebar.children("#viewSelectDiv").remove();
    
    if(this.views.length > 2) {
        var viewSelectDiv = $('<div id="viewSelectDiv"></div>');
        this.$sidebar.append(viewSelectDiv);
        
        viewSelectDiv.append('<p>View 1:</p>');
        
        var viewSelect1 = $('<select id="viewSelect1"></select>');
        viewSelect1.css("width", Global.SIDE_BAR_WIDTH - 50);
        viewSelectDiv.append(viewSelect1);
        
        viewSelectDiv.append('<p>View 2:</p>');
        
        var viewSelect2 = $('<select id="viewSelect2"></select>');
        viewSelect2.css("width", Global.SIDE_BAR_WIDTH - 50);
        viewSelectDiv.append(viewSelect2);

        viewSelectDiv.append('<p></p>');
        
        this.views.forEach(function(view) {
            var label = view.getLabel();
            
            if(label != global.view2.getLabel()) {
                viewSelect1.append('<option value="' + label + '">' + label + '</option>');
            }
            
            if(label != global.view1.getLabel()) {
                viewSelect2.append('<option value="' + label + '">' + label + '</option>');
            }
        });
        
        viewSelect1.children("option[value='" + this.view1.getLabel() + "']").prop("selected", true);
        viewSelect2.children("option[value='" + this.view2.getLabel() + "']").prop("selected", true);
        
        viewSelect1.unbind().on("change", function(e) {
           var val = $("#viewSelect1 option:selected").val();
           global.view1 = global.getViewByLabel(val);
           global.drawAll();
        });
        
        viewSelect2.unbind().on("change", function(e) {
            var val = $("#viewSelect2 option:selected").val();
            global.view2 = global.getViewByLabel(val);
            global.drawAll();
         });
        
    }

    
    var hiddenHosts = {};
    this.view1.getTransformer().getHiddenHosts().forEach(function(host) {
        hiddenHosts[host] = true;
    });
    
    if(this.view2 != null) {
        this.view2.getTransformer().getHiddenHosts().forEach(function(host) {
            hiddenHosts[host] = true;
        });
    }
    
    // Draw hidden hosts
    var hh = Object.keys(hiddenHosts);
    if (hh.length <= 0) {
        return;
    }

    this.$sidebar.append('<div id="hiddenHosts">Hidden processes:</div>');
    var hidden = d3.select("#hiddenHosts");

    var hostsPerLine = Math.floor((Global.SIDE_BAR_WIDTH + 5) / (Global.HOST_SQUARE_SIZE + 5));
    var count = 0;

    var x = Global.SIDE_BAR_WIDTH;
    var y = 0;

    var hiddenHosts = hidden.append("svg");
    hiddenHosts.attr({
        "width": this.$sidebar.width(),
        "height": Math.ceil(hh.length / hostsPerLine) * (Global.HOST_SQUARE_SIZE + 5) - 5,
        "class": "hidden-hosts"
    });

    var hiddenHostsGroup = hiddenHosts.append("g");
    hiddenHostsGroup.append("title").text("Double click to view");

    var rect = hiddenHosts.selectAll().data(hh).enter().append("rect");
    rect.attr("width", Global.HOST_SQUARE_SIZE);
    rect.attr("height", Global.HOST_SQUARE_SIZE);
    rect.style("fill", function(host) {
        return global.hostPermutation.getHostColor(host);
    });
    rect.append("title").text("Double click to view");

    rect.attr("y", function(host) {
        count++;
        if (count > hostsPerLine) {
            y += Global.HOST_SQUARE_SIZE + 5;
            count = 1;
        }

        return y;
    });
    rect.attr("x", function(host) {
        x += Global.HOST_SQUARE_SIZE + 5;
        if (x + Global.HOST_SQUARE_SIZE > Global.SIDE_BAR_WIDTH) {
            x = 0;
        }
        return x;
    });

    this.controller.bindHiddenHosts(rect);
};