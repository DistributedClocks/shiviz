/**
 * Constructs a Global
 * 
 * @classdesc
 * 
 * A Global is the visualization in its entirety. It is a composition of {@link View}s
 * and is responsible for coordinating information that's shared across Views. 
 * It is also responsible for drawing things shared across all
 * Views such as the list of hidden hosts
 * 
 * @constructor
 * @param {HostPermutation} hostPermuation describes how the hosts should be ordered
 */
function Global(hostPermutation) {

    /** @private */
    this.views = [];

    /** @private */
    this.transformations = [];
    
    /** @private */
    this.hostPermutation = hostPermutation;

    /** @private */
    this.highlightHostTransformation = new HighlightHostTransformation([]);
    this.addTransformation(this.highlightHostTransformation);

    /** @private */
    this.hideHostTransformation = new HideHostTransformation();
    this.addTransformation(this.hideHostTransformation);

    $("#sidebar").css({
        width: Global.SIDE_BAR_WIDTH + "px",
        float: "left"
    });

    $(window).unbind("scroll");
    $(window).on("scroll", null, this, this.scrollHandler);

    this.scrollHandler({
        data: this
    });

    var g = this;
    
    $(window).unbind("resize");
    $(window).on("resize", function() {
        g.drawAll.call(g);
    });
}

Global.SIDE_BAR_WIDTH = 240;
Global.HOST_SQUARE_SIZE = 25;
Global.HIDDEN_EDGE_LENGTH = 40;
Global.MIN_HOST_WIDTH = 40;


/**
 * Adds a transformation that is to be applied to all views. The transformation
 * for a view will not be applied until it is redrawn (i.e by calling
 * view.draw() to redraw a single view or global.drawAll() to redraw all views
 * belonging to this global)
 * 
 * @param {Transformation} transformation The transformation to add
 */
Global.prototype.addTransformation = function(transformation) {
    this.transformations.push(transformation);
};

/**
 * Redraws the global.
 */
Global.prototype.drawAll = function() {
    var hostMargin = this.resize();

    $("table.log").children().remove();
    var width = (240 - 12 * (this.views.length - 1)) / this.views.length;
    for (var i = 0; i < this.views.length; i++) {
        $("table.log").append($("<td></td>").width(width + "pt"));
        this.views[i].draw();
        $("table.log").append($("<td></td>").addClass("spacer"));
    }

    $("#vizContainer > svg:not(:last-child), #hostBar > svg:not(:last-child)").css({
        "margin-right": hostMargin * 2 + "px"
    });
    $("table.log .spacer:last-child").remove();

    this.drawSideBar();
};

/**
 * Gets the transformations belonging to this global as an array
 * 
 * @returns {Array.<Transformation>} The transformations
 */
Global.prototype.getTransformations = function() {
    return this.transformations.slice();
};

/**
 * Hides a host from all views and re-draws this global.
 * 
 * @param {String} hostId The host to hide.
 */
Global.prototype.hideHost = function(hostId) {
    this.hideHostTransformation.addHost(hostId);
    this.highlightHostTransformation.clearHostsToHighlight();
    this.drawAll();
};

/**
 * Unhides a host from all views and re-draws this global. If the specified host
 * doesn't exist or is not currently hidden, this method does nothing.
 * 
 * @param {String} hostId The host to unhide
 */
Global.prototype.unhideHost = function(hostId) {
    this.hideHostTransformation.removeHost(hostId);
    this.highlightHostTransformation.clearHostsToHighlight();
    this.drawAll();
};

Global.prototype.toggleHighlightHost = function(host) {
    if (this.views.length > 1) {
        return;
    }
    this.highlightHostTransformation.toggleHostToHighlight(host);
    this.drawAll();
    this.drawAll();
};

/**
 * Adds a View to this global.
 * 
 * @param {View} view The view to add
 */
Global.prototype.addView = function(view) {
    this.views.push(view);
    this.resize();
};

/**
 * Resizes the graph
 */
Global.prototype.resize = function() {
    var hiddenHosts = this.hideHostTransformation.getHostsToHide();
    var highHosts = this.highlightHostTransformation.getHiddenHosts();
    var allHidden = hiddenHosts.concat(highHosts);
    var visibleHosts = 0;

    for (var i = 0; i < this.views.length; i++) {
        var vh = this.views[i].getHosts();
        var hn = 0;
        for (var j = 0; j < vh.length; j++)
            if (allHidden.indexOf(vh[j]) > -1)
                hn++;

        visibleHosts = visibleHosts + vh.length - hn;
    }

    var headerWidth = $(".visualization header").outerWidth();
    var sidebarWidth = $("#sidebar").outerWidth();
    var globalWidth = $(window).width() - headerWidth - sidebarWidth;
    
    var widthPerHost = globalWidth / visibleHosts;

    for (var i = 0; i < this.views.length; i++) {
        var view = this.views[i];
        var hosts = view.getHosts().filter(function (h) {
            return allHidden.indexOf(h) < 0;
        });
        view.setWidth(hosts.length * widthPerHost);
    }

    $("#graph").width(globalWidth);
};

/**
 * Draws the hidden hosts, if any exist.
 * 
 * @private
 */
Global.prototype.drawSideBar = function() {
    $("#sidebar .hidden svg").remove();

    var global = this;
    var hidden = d3.select(".hidden");

    // Draw hidden hosts
    var hiddenHosts = this.hideHostTransformation.getHostsToHide();
    var highHosts = this.highlightHostTransformation.getHiddenHosts();
    var hh = hiddenHosts.concat(highHosts);
    if (hh.length <= 0) {
        return;
    }

    var hiddenHosts = hidden.append("svg");
    hiddenHosts.attr({
        "width": $("#sidebar").width(),
        "height": 500,
        "class": "hidden-hosts"
    });

    var x = 0;
    var y = 65;

    var hiddenHostsGroup = hiddenHosts.append("g");
    hiddenHostsGroup.append("title").text("Double click to view");

    var hiddenText = hiddenHostsGroup.append("text");
    hiddenText.attr({
        "x": x,
        "y": y
    });
    hiddenText.text('Hidden');

    var hostsText = hiddenHostsGroup.append("text");
    hostsText.attr({
        "x": x,
        "y": y,
        "dy": "1em"
    });
    hostsText.text('hosts:');

    var rect = hiddenHosts.selectAll().data(hh).enter().append("rect");
    rect.attr("width", Global.HOST_SQUARE_SIZE);
    rect.attr("height", Global.HOST_SQUARE_SIZE);
    rect.style("fill", function(host) {
        return global.hostPermutation.getHostColor(host);
    });
    rect.on("dblclick", function(e) {
        global.unhideHost(e);
    });
    rect.on("mouseover", function(e) {
        $("#curNode").innerHTML = e;
    });
    rect.append("title").text("Double click to view");

    var hostsPerLine = Math.floor((Global.SIDE_BAR_WIDTH + 5) / (Global.HOST_SQUARE_SIZE + 5));
    var count = 0;
    y += 25;
    x = Global.SIDE_BAR_WIDTH + 1;

    rect.attr("y", function(host) {
        count++;
        if (count > hostsPerLine) {
            y += Global.HOST_SQUARE_SIZE + 5;
            count = 1;
        }

        return y;
    });
    rect.attr("x", function(host) {
        x += 30;
        if (x + Global.HOST_SQUARE_SIZE > Global.SIDE_BAR_WIDTH) {
            x = 0;
        }
        return x;
    });
};

/**
 * Ensures things are positioned correctly on scroll
 * 
 * @private
 * @param {Event} The event object JQuery passes to the handler
 */
Global.prototype.scrollHandler = function(event) {
    var x = window.pageXOffset;
    $("#hostBar").css("margin-left", -x);
    $(".log").css("margin-left", x);

    if ($(".line.focus").length)
        $(".highlight").css({
            "left": $(".line.focus").offset().left - parseFloat($(".line.focus").css("margin-left"))
        });
};