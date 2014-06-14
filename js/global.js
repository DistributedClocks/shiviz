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

Global.SIDE_BAR_WIDTH = 115;
Global.HOST_SQUARE_SIZE = 25;

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
        if(!this.hostColors[host]) {
            this.hostColors[host] = this.color(host);
        }
    }
    this.views.push(view);
    
    var totalWidth = $("body").width() - Global.SIDE_BAR_WIDTH;
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
Global.prototype.drawSideBar = function() {
    d3.selectAll("#sideBar svg").remove();
    
    var view = this;
    var sideBar = d3.select("#sideBar");
    
 // Draw time arrow with label
    var height = 200;
    var timeArrow = sideBar.append("svg");
    timeArrow.attr("width", Global.SIDE_BAR_WIDTH);
    timeArrow.attr("height", height);

    
    var x = Global.SIDE_BAR_WIDTH / 2;
    var y1 = 85;
    var y2 = height - 30;

    var line = timeArrow.append("line");
    line.attr("class", "time");
    line.attr("x1", x);
    line.attr("y1", y1 + 15);
    line.attr("x2", x);
    line.attr("y2", y2);
    line.style("stroke-width", 3);

    var path = timeArrow.append("path");
    path.attr("class", "time");
    path.attr("d", "M " + (x - 5) + " " + y2 + " L " + (x + 5) + " " + y2 + " L " + x + " " + (y2 + 10) + " z");

    var timeText = timeArrow.append("text");
    timeText.attr("class", "time");
    timeText.attr("x", x - 20);
    timeText.attr("y", y1 - 5);
    timeText.text("Time");
    
    
    // Draw hidden hosts
    if (this.hiddenHosts.length <= 0) {
        return;
    }
    
    var hiddenHosts = sideBar.append("svg");
    hiddenHosts.attr("width", Global.SIDE_BAR_WIDTH);
    hiddenHosts.attr("height", 500);

    var x = 0;
    var y = 65;

    var hiddenHostsText = hiddenHosts.append("text");
    hiddenHostsText.attr("class", "time");
    hiddenHostsText.attr("x", x);
    hiddenHostsText.attr("y", y);
    hiddenHostsText.text("Hidden hosts:");
    hiddenHostsText.append("title").text("Double click to view");

    var rect = hiddenHosts.selectAll().data(this.hiddenHosts).enter().append("rect");
    rect.style("stroke", "#fff");
    rect.attr("width", Global.HOST_SQUARE_SIZE);
    rect.attr("height", Global.HOST_SQUARE_SIZE);
    rect.append("title").text("Double click to view");
    
    rect.style("fill", function(host) {
        return view.hostColors[host];
    });
    
    rect.on("dblclick", function(e) {
        view.unhideHost(e);
        });
            
    rect.on("mouseover", function(e) {
                $("#curNode").innerHTML = e;
            });
            
    var hostsPerLine = Math.floor((Global.SIDE_BAR_WIDTH + 5) / (Global.HOST_SQUARE_SIZE + 5));
    var count = 0;
    y += 15;
    x = Global.SIDE_BAR_WIDTH + 1;
    
    rect.attr("y", function(host) {
        count++;
        if(count > hostsPerLine) {
            y += Global.HOST_SQUARE_SIZE + 5;
            count = 1;
        }
        
        return y;
    });
    
    rect.attr("x", function(host) {
        x += 30;
        if(x + Global.HOST_SQUARE_SIZE > Global.SIDE_BAR_WIDTH) {
            x = 0;
        }
        return x;
    });
       
    
};

