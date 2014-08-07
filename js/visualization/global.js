/**
 * Constructs a Global
 * 
 * @classdesc
 * 
 * A Global is the visualization in its entirety. It is a composition of
 * {@link View}s and is responsible for coordinating information that's shared
 * across Views. It is also responsible for drawing things shared across all
 * Views such as the list of hidden hosts
 * 
 * @constructor
 * @param {HostPermutation} hostPermuation describes how the hosts should be
 *            ordered
 */
function Global(hostPermutation) {

    /** @private */
    this.views = [];

    /** @private */
    this.hostPermutation = hostPermutation;

    /** @private */
    this.hiddenHosts = [];

    /** @private */
    this.controller = new Controller(this);

    Global.SIDE_BAR_WIDTH = 240;
    Global.HOST_SQUARE_SIZE = 25;
    Global.HIDDEN_EDGE_LENGTH = 40;

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

/**
 * Adds a hidden host to the list
 * 
 * @param {String} host The host to add
 */
Global.prototype.addHiddenHost = function(host) {
    if (this.hiddenHosts.indexOf(host) < 0)
        this.hiddenHosts.push(host);
}

/**
 * Removes a hidden host to the list
 * 
 * @param {String} host The host to remove
 */
Global.prototype.removeHiddenHost = function(host) {
    var i = this.hiddenHosts.indexOf(host);
    this.hiddenHosts.splice(i, 1);
}

/**
 * Redraws the global.
 */
Global.prototype.drawAll = function() {
    // TODO: don't draw twice (workaround)
    // TODO: Cleanup & comment
    var width = (240 - 12 * (this.views.length - 1)) / this.views.length;
    var hostMargin = this.resize();
    $("table.log").children().remove();

    for (var i = 0; i < this.views.length; i++) {
        $("table.log").append($("<td></td>").width(width + "pt"));
        this.views[i].draw();
        $("table.log").append($("<td></td>").addClass("spacer"));
    }

    hostMargin = this.resize();
    $("table.log").children().remove();

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
 * Adds a View to this global.
 * 
 * @param {View} view The view to add
 */
Global.prototype.addView = function(view) {
    this.views.push(view);
    this.controller.addView(view);
    this.resize();
};

/**
 * Gets the list of Views
 * 
 * @returns {Array<View>} The list of views
 */
Global.prototype.getViews = function() {
    return this.views;
}

/**
 * Gets the list of current VisualGraphs
 * 
 * @returns {Array<VisualGraph>} The current models from each View
 */
Global.prototype.getVisualModels = function() {
    return this.views.map(function(v) {
        return v.getVisualModel();
    });
}

/**
 * Resizes the graph
 */
Global.prototype.resize = function() {
    var global = this;
    var visibleHosts = 0;

    // TODO: Refactor into Controller and update to use hostPermutation
    // Plus length of hiddenHosts instead of indexOf.
    for (var i = 0; i < this.views.length; i++) {
        var vh = this.views[i].getHosts();
        var hn = 0;
        vh.forEach(function(h) {
            if (global.hiddenHosts.indexOf(h) > -1)
                hn++;
        });

        visibleHosts = visibleHosts + vh.length - hn;
    }

    // TODO: rename to sidebarLeft sidebarRight middleWidth
    var headerWidth = $(".visualization header").outerWidth();
    var sidebarWidth = $("#sidebar").outerWidth();
    var globalWidth = $(window).width() - headerWidth - sidebarWidth;
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

    // TODO: More refactoring
    for (var i = 0; i < this.views.length; i++) {
        var view = this.views[i];
        var hosts = view.getHosts().filter(function(h) {
            return global.hiddenHosts.indexOf(h) < 0;
        });
        view.setWidth(hosts.length * widthPerHost - hostMargin);
    }

    $("#graph").width(globalWidth);

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
    $("#sidebar .hidden svg").remove();

    var global = this;
    var hidden = d3.select(".hidden");

    // Draw hidden hosts
    var hh = this.hiddenHosts;
    if (hh.length <= 0) {
        $(".hidden").hide();
        return;
    }

    $(".hidden").show();

    var hostsPerLine = Math.floor((Global.SIDE_BAR_WIDTH + 5) / (Global.HOST_SQUARE_SIZE + 5));
    var count = 0;

    var x = Global.SIDE_BAR_WIDTH;
    var y = 0;

    var hiddenHosts = hidden.append("svg");
    hiddenHosts.attr({
        "width": $("#sidebar").width(),
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