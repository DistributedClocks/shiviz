/**
 * @class
 * A Global is the visualization in its entirety. It is a composition of Views and is responsible
 * for information that's shared across Views such as the colors for hosts. It is also responsible for drawing 
 * things shared across all Views such as the list of hidden hosts
 * 
 * @constructor
 */
function Global() {
    
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
}


/**
 * Gets a mapping of host names to its designated color
 * 
 * @returns {Object<String, Number>} A mapping of host names to its designated color
 */
Global.prototype.getHostColors = function() {
    var colors = {};
    for(var host in this.hostColors) {
        colors[host] = this.hostColors[host];
    }
    return colors;
};

/**
 * Adds a transformation that is to be applied to all views. The transformation for a view will not be applied
 * until it is redrawn (i.e by calling view.draw() to redraw a single view or global.drawAll() to redraw all views
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
    for(var i = 0; i < this.views.length; i++) {
        this.views[i].draw();
    }
    this.drawHiddenHosts();
    this.drawArrow();
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
 * Unhides a host from all views and re-draws this global. If the specified host doesn't exist or is not
 * currently hidden, this method does nothing.
 * 
 * @param {String} hostId The host to unhide
 */
Global.prototype.unhideHost = function(hostId) {
    var index = this.hiddenHosts.indexOf(hostId);
    
    if(index < 0) {
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
    for(var i = 0; i < newHosts.length; i++) {
        var host = newHosts[i];
        this.hosts.push(host);
        if(!this.hostColors[host]) {
            this.hostColors[host] = this.color(host);
        }
    }
    this.views.push(view);
    
    var totalWidth = $("body").width();
    var totalHosts = 0;
    for(var i = 0; i < this.views.length; i++) {
        totalHosts += this.views[i].getHosts().length;
    }
    
    var widthPerHost = Math.max(totalWidth / totalHosts, 40);
    
    for(var i = 0; i < this.views.length; i++) {
        var view = this.views[i];
        view.setWidth(view.getHosts().length * widthPerHost);
    }
};


/**
 * Draws the hidden hosts, if any exist.
 * 
 * @private
 */
Global.prototype.drawHiddenHosts = function() {
    d3.selectAll("#hosts svg").remove();
    
    if (this.hiddenHosts.length <= 0) {
        return;
    }

    // Define locally so that we can use in lambdas below
    var view = this;

    var svg = d3.select("#hosts").append("svg");
    
    svg.attr("width", 120);
    svg.attr("height", 500);

    var x = 0;
    var y = 65;

    var text = svg.append("text").attr("class", "time").attr("x", x).attr("y",
            y).text("Hidden hosts:");

    y += 15;
    var xDelta = 5;
    x = xDelta;
    var count = 0;

    var rect = svg.selectAll().data(this.hiddenHosts).enter().append("rect")
            .on("dblclick", function(e) {
                view.unhideHost(e);
            }).on("mouseover", function(e) {
                $("#curNode").innerHTML = e;
            }).style("stroke", "#fff").attr("width", 25).attr("height", 25)
            .style("fill", function(host) {
                return view.hostColors[host];
            }).attr("y", function(host) {
                if (count == 3) {
                    y += 30;
                    count = 0;
                }
                count += 1;
                return y;
            }).attr("x", function(host) {
                var curX = x;
                x += 30;
                if (x > 65) {
                    x = xDelta;
                }
                return curX;
            });

    text.append("title").text("Double click to view");
    rect.append("title").text("Double click to view");
};



/**
 * Draws the time arrow.
 * 
 * @private
 */
Global.prototype.drawArrow = function() {
    var width = 40;
    var height = 200;
    var sideBar = d3.select("#sideBar");

    // Don't draw the arrow twice
    if (sideBar.selectAll("svg").size())
        return;

    var svg = sideBar.append("svg");
    svg.attr("width", width);
    svg.attr("height", height);

    // Draw time arrow with label
    var x = width / 2;
    var y1 = 85;
    var y2 = height - 30;

    svg.append("line").attr("class", "time").attr("x1", x).attr("y1", y1 + 15)
            .attr("x2", x).attr("y2", y2).style("stroke-width", 3);

    svg.append("path").attr("class", "time").attr(
            "d",
            "M " + (x - 5) + " " + y2 + " L " + (x + 5) + " " + y2 + " L " + x
                    + " " + (y2 + 10) + " z");

    svg.append("text").attr("class", "time").attr("x", x - 20)
            .attr("y", y1 - 5).text("Time");
};