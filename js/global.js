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
function Global() {
    var g = this;

    /** @private */
    this.views = [];

    /** @private */
    this.transformations = [];

    /** @private */
    this.hiddenHosts = [];

    /** @private */
    this.hiddenHostToTransformation = {};

    /** @private */
    this.hostColors = {};

    /** @private */
    this.color = d3.scale.category20();

    /** @private */
    this.overflow = null;

    /** @private */
    this.scrollPast = null;

    /** @private */
    this.scrollPastPoint = -1;

    $("#sidebar").css({
        width: Global.SIDE_BAR_WIDTH + "px",
        float: "left"
    });

    $(window).unbind("scroll");
    $(window).on("scroll", null, this, this.scrollHandler);

    this.scrollHandler({
        data: this
    });

    $(window).unbind("resize");
    $(window).on("resize", function() {
        g.drawAll.call(g);
    });
}

Global.SIDE_BAR_WIDTH = 240;
Global.HOST_SQUARE_SIZE = 25;

/**
 * Gets a mapping of host names to its designated color
 * 
 * @returns {Object<String, Number>} A mapping of host names to its designated
 *          color
 */
Global.prototype.getHostColors = function() {
    var colors = {};
    for (var host in this.hostColors) {
        colors[host] = this.hostColors[host];
    }
    return colors;
};

/**
 * Adds a transformation that is to be applied to all views. The transformation
 * for a view will not be applied until it is redrawn (i.e by calling
 * view.draw() to redraw a single view or global.drawAll() to redraw all views
 * belonging to this global)
 * 
 * @param {Transform} transformation The transformation to add
 */
Global.prototype.addTransformation = function(transformation) {
    this.transformations.push(transformation);
};

/**
 * Redraws the global.
 */
Global.prototype.drawAll = function() {
    var hostMargin = this.resize();
    this.drawSideBar();

    $("table.log").children().remove();
    var width = (240 - 12 * (this.views.length - 1)) / this.views.length;
    for (var i = 0; i < this.views.length; i++) {
        $("table.log").append($("<td></td>").width(width + "pt"));
        this.views[i].draw();
        $("table.log").append($("<td></td>").addClass("spacer"));
    }

    $("#vizContainer > svg:not(:last-child), #hostBar > svg:not(:last-child)").css("margin-right", hostMargin * 2 + "px");
    $("table.log .spacer:last-child").remove();
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
    var transform = new HideHostTransformation(hostId);
    this.hiddenHostToTransformation[hostId] = transform;
    this.hiddenHosts.push(hostId);
    this.addTransformation(transform);
    this.drawAll();
};

/**
 * Unhides a host from all views and re-draws this global. If the specified host
 * doesn't exist or is not currently hidden, this method does nothing.
 * 
 * @param {String} hostId The host to unhide
 */
Global.prototype.unhideHost = function(hostId) {
    var index = this.hiddenHosts.indexOf(hostId);

    if (index < 0) {
        return;
    }

    this.hiddenHosts.splice(index, 1);
    this.transformations.splice(this.transformations.indexOf(this.hiddenHostToTransformation[hostId]), 1);
    this.drawAll();
};

/**
 * Gets the hosts that are currently hidden
 * 
 * @returns {Array.<String>} An array of currently hidden hosts
 */
Global.prototype.getHiddenHosts = function() {
    return this.hiddenHosts.slice();
};

/**
 * Adds a View to this global.
 * 
 * @param {View} view The view to add
 */
Global.prototype.addView = function(view) {
    var newHosts = view.getHosts();
    for (var i = 0; i < newHosts.length; i++) {
        var host = newHosts[i];
        if (!this.hostColors[host]) {
            this.hostColors[host] = this.color(host);
        }
    }
    this.views.push(view);
    this.resize();
};

/**
 * Resizes the graph
 */
Global.prototype.resize = function() {
    var hiddenHosts = this.getHiddenHosts();
    var totalHosts = -hiddenHosts.length;
    for (var i = 0; i < this.views.length; i++) {
        totalHosts += this.views[i].getHosts().length;
    }

    var globalWidth = $(window).width() - $(".visualization header").outerWidth() - $("#sidebar").outerWidth();
    var totalMargin = globalWidth - totalHosts * Global.HOST_SQUARE_SIZE;
    var hostMargin = totalMargin / (totalHosts + this.views.length - 2);

    if (hostMargin < Global.HOST_SQUARE_SIZE) {
        hostMargin = Global.HOST_SQUARE_SIZE;
        totalMargin = hostMargin * (totalHosts + this.views.length - 2);
        globalWidth = totalMargin + totalHosts * Global.HOST_SQUARE_SIZE;
    }

    var widthPerHost = Global.HOST_SQUARE_SIZE + hostMargin;

    for (var i = 0; i < this.views.length; i++) {
        var view = this.views[i];
        var hosts = view.getHosts().filter(function (h) {
            return hiddenHosts.indexOf(h) < 0;
        });
        view.setWidth(hosts.length * widthPerHost - hostMargin);
    }

    $("#graph").width(globalWidth);

    return hostMargin;
}

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
    if (this.hiddenHosts.length <= 0) {
        return;
    }

    var hiddenHosts = hidden.append("svg");
    hiddenHosts.attr({
        "width": Global.SIDE_BAR_WIDTH,
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

    var rect = hiddenHosts.selectAll().data(this.hiddenHosts).enter().append("rect");
    rect.attr("width", Global.HOST_SQUARE_SIZE);
    rect.attr("height", Global.HOST_SQUARE_SIZE);
    rect.style("fill", function(host) {
        return global.hostColors[host];
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
};