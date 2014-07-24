/**
 * @class
 * 
 * A Global is the visualization in its entirety. It is a composition of Views
 * and is responsible for information that's shared across Views such as the
 * colors for hosts. It is also responsible for drawing things shared across all
 * Views such as the list of hidden hosts
 * 
 * @constructor
 */
function Global(hostPermutation) {

    /** @private */
    this.views = [];
    
    /** @private */
    this.hostPermutation = hostPermutation;

    /** @private */
    this.hiddenHosts = {};

    /** @private */
    this.controller = new Controller(this);

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

/**
 * Adds a hidden host to the list
 * 
 * @param {String} host The host to add
 */
Global.prototype.addHiddenHost = function(host) {
    if (this.hiddenHosts[host])
        this.hiddenHosts[host] = this.hiddenHosts[host] + 1;
    else
        this.hiddenHosts[host] = 1;
}

/**
 * Removes a hidden host to the list
 * 
 * @param {String} host The host to remove
 */
Global.prototype.removeHiddenHost = function(host) {
    if (this.hiddenHosts[host]) {
        this.hiddenHosts[host] = this.hiddenHosts[host] - 1;
        if (this.hiddenHosts[host] == 0)
            delete this.hiddenHosts[host];
    }
}

/**
 * Redraws the global.
 */
Global.prototype.drawAll = function(_repeat) {
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
 * @returns {[View]} The list of views
 */
Global.prototype.getViews = function() {
    return this.views;
}

/**
 * Gets the list of current VisualGraphs
 *
 * @returns {[VisualGraph]} The current models from each View
 */
Global.prototype.getVisualModels = function() {
    return this.views.map(function (v) {
        return v.getVisualModel();
    });
}

/**
 * Resizes the graph
 */
Global.prototype.resize = function() {
    var global = this;
    var visibleHosts = 0;

    for (var i = 0; i < this.views.length; i++) {
        var vh = this.views[i].getHosts();
        var hn = 0;
        vh.forEach(function(h) {
            if (h in global.hiddenHosts)
                hn++;
        });

        visibleHosts = visibleHosts + vh.length - hn;
    }

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

    for (var i = 0; i < this.views.length; i++) {
        var view = this.views[i];
        var hosts = view.getHosts().filter(function (h) {
            return !(h in global.hiddenHosts);
        });
        view.setWidth(hosts.length * widthPerHost - hostMargin);
    }

    $("#graph").width(globalWidth);

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
    var hh = Object.keys(this.hiddenHosts);
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

    this.controller.bind(null, null, null, rect);
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