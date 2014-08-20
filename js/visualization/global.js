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
function Global($vizContainer, $sidebar) {

    if (!!Global.instance) {
        throw new Exception("Global is a singleton - use getInstance() instead.");
    }

    /** @private */
    this.views = [];

    /** @private */
    this.hostPermutation = null;

    /** @private */
    this.controller = new Controller(this);
    
    this.$vizContainer = $vizContainer;
    
    this.$sidebar = $sidebar;

    this.$sidebar.css({
        width: Global.SIDE_BAR_WIDTH + "px"
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
 * Returns all hidden hosts over all views
 * 
 * @private
 * @returns {Set<Hosts>}
 */
Global.prototype.getHiddenHosts = function() {
    var hiddenHosts = {};
    
    this.views.forEach(function(view) {
        view.getTransformer().getHiddenHosts().forEach(function(host) {
            hiddenHosts[host] = true;
        });
    });
    
    return hiddenHosts;
};

/**
 * Redraws the global.
 */
Global.prototype.drawAll = function() {

    // Determine the max height of any view
    // And if larger than window height (scrollbar will appear)
    // then make scrollbar appear BEFORE calling resize
    var maxHeight = Math.max.apply(null, this.views.map(function(v) {
        v.getVisualModel().update();
        return v.getVisualModel().getHeight();
    }));
    
    this.$vizContainer.height(maxHeight);

    var hostMargin = this.resize();
    
    for (var i = 0; i < this.views.length; i++) {
        this.views[i].draw();
    }

    // Add spacing between views
    $("#vizContainer > svg:not(:last-child), #hostBar > svg:not(:last-child)").css({
        "margin-right": hostMargin * 2 + "px"
    });

    this.drawSideBar();
};

/**
 * Adds a View to this global.
 * 
 * @param {View} view The view to add
 */
Global.prototype.addView = function(view) {
    this.views.push(view);
//    view.controller = this.controller; //TODO
    this.resize();
};

/**
 * Gets the list of Views
 * 
 * @returns {Array<View>} The list of views
 */
Global.prototype.getViews = function() {
    return this.views.slice();
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
    var hiddenHosts = this.getHiddenHosts();
    var numHidden = Object.keys(hiddenHosts).length;
    var allHosts = this.hostPermutation.getHosts().length;   
    var visibleHosts = allHosts - numHidden;

    // TODO: rename to sidebarLeft sidebarRight middleWidth
    var headerWidth = $(".visualization header").outerWidth();
    var sidebarWidth = this.$sidebar.outerWidth();
    var globalWidth = $(window).width() - headerWidth - sidebarWidth;
    
    $("#searchbar").width(globalWidth);
    
    var totalMargin = globalWidth - visibleHosts * Global.HOST_SQUARE_SIZE;
    var hostMargin = totalMargin / (visibleHosts + this.views.length - 2);

    if (hostMargin < Global.HOST_SQUARE_SIZE) {
        hostMargin = Global.HOST_SQUARE_SIZE;
        totalMargin = hostMargin * (visibleHosts + this.views.length - 2);
        globalWidth = totalMargin + visibleHosts * Global.HOST_SQUARE_SIZE;
    }

    var widthPerHost = Global.HOST_SQUARE_SIZE + hostMargin;

    if (visibleHosts == 1) {
        widthPerHost = globalWidth;
        hostMargin = 0;
    }

    this.views.forEach(function(view) {
        var hosts = view.getHosts().filter(function(h) {
            return !hiddenHosts[h];
        });
        view.setWidth(hosts.length * widthPerHost - hostMargin);
    });

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

    return hostMargin;
};

/**
 * Draws the hidden hosts, if any exist.
 * 
 * @private
 */
Global.prototype.drawSideBar = function() {
    
    this.$sidebar.children(".hidden").children("svg").remove();

    var global = this;
    var hidden = d3.select(".hidden");

    // Draw hidden hosts
    var hh = Object.keys(this.getHiddenHosts());
    if (hh.length <= 0) {
        this.$sidebar.children(".hidden").hide();
        return;
    }

    this.$sidebar.children(".hidden").show();

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