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

    /** @private */
    this.views = [];

    /** @private */
    this.transformations = [];

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
    
    /** @private */
    this.highlightHostTransformation = new HighlightHostTransformation([]);
    this.addTransformation(this.highlightHostTransformation );
    
    /** @private */
    this.hideHostTransformation = new HideHostTransformation();
    this.addTransformation(this.hideHostTransformation);

    $("#sideBar").css({
        width: Global.SIDE_BAR_WIDTH + "px",
        float: "left"
    });

    $(window).unbind("scroll");
    $(window).on("scroll", null, this, this.scrollHandler);
    this.scrollHandler({
        data: this
    });

}

Global.SIDE_BAR_WIDTH = 60;
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
    for (var i = 0; i < this.views.length; i++) {
        this.views[i].draw();
    }
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
    if(this.views.length > 1) {
        return;
    }
    this.highlightHostTransformation.toggleHostToHighlight(host);
    this.drawAll();
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

    var totalWidth = $("body").width() - Global.SIDE_BAR_WIDTH;
    var totalHosts = 0;
    for (var i = 0; i < this.views.length; i++) {
        totalHosts += this.views[i].getHosts().length;
    }

    var widthPerHost = Math.max(totalWidth / totalHosts, 40);

    for (var i = 0; i < this.views.length; i++) {
        var view = this.views[i];
        view.setWidth(view.getHosts().length * widthPerHost);
    }
};

/**
 * Draws the hidden hosts, if any exist.
 * 
 * @private
 */
Global.prototype.drawSideBar = function() {
    $("#sideBar svg").remove();

    var global = this;
    var sideBar = d3.select("#sideBar");

    // Draw time arrow with label
    var height = 200;
    var timeArrow = sideBar.append("svg").attr({
        "width": Global.SIDE_BAR_WIDTH,
        "height": height,
        "class": "arrow"
    });

    var x = Global.SIDE_BAR_WIDTH / 2;
    var y1 = 85;
    var y2 = height - 30;

    var line = timeArrow.append("line");
    line.attr("x1", x);
    line.attr("y1", y1 + 15);
    line.attr("x2", x);
    line.attr("y2", y2);

    var path = timeArrow.append("path");
    path.attr("d", "M " + (x - 5) + " " + y2 + " L " + (x + 5) + " " + y2 + " L " + x + " " + (y2 + 10) + " z");

    var timeText = timeArrow.append("text");
    timeText.attr("x", x - 20);
    timeText.attr("y", y1 - 5);
    timeText.text("Time");

    // Draw hidden hosts
    var hh = this.hideHostTransformation.getHostsToHide().concat(this.highlightHostTransformation.getHiddenHosts());
    if (hh.length <= 0) {
        return;
    }

    var hiddenHosts = sideBar.append("svg");
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

    var rect = hiddenHosts.selectAll().data(hh).enter().append("rect");
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

    var global = event.data;

    var top = window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;

    var paddingWidth = ($(window).width() - $("body").width()) / 2;
    var left = Math.max(paddingWidth, 0) - $(document).scrollLeft();

    var overflow = paddingWidth < 0;

    if (global.scrollPastPoint <= 0) {
        global.scrollPastPoint = $('#reference').offset().top - parseInt($('#reference p').css('margin-top'));
    }

    var scrollPast = (global.scrollPastPoint > 0 && top > global.scrollPastPoint);

    if (global.overflow == overflow && global.scrollPast == scrollPast) {
        return;
    }

    global.overflow = overflow;
    global.scrollPast = scrollPast;

    if (scrollPast) {
        $("body").addClass("fixed");

        $("#sideBar").css({
            top: $("#topBar").height() + "px",
            left: left + "px"
        });

        if (overflow) {
            $("#sideBar").css({
                left: "auto",
                marginLeft: left + "px"
            });
        }

        $("#hostBar").css({
            left: overflow ? "auto" : 0,
            marginLeft: left + Global.SIDE_BAR_WIDTH + "px"
        });

        $("#vizContainer").css({
            marginTop: $("#topBar").height() - parseInt($("#topBar p").css("margin-top")) + 55 + "px",
            marginLeft: Global.SIDE_BAR_WIDTH + "px"
        });

    }
    else {
        $("body").removeClass("fixed");

        $("#sideBar").css({
            top: "",
            left: "0px",
            marginLeft: ""
        });

        $("#hostBar").css({
            marginLeft: 0,
            left: ""
        });

        $("#vizContainer").css({
            marginLeft: "0",
            marginTop: ""
        });
    }
};