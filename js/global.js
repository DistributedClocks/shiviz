function Global() {
    this.hosts = [];
    this.views = [];
    this.transformations = [];
    this.hiddenHosts = [];
    this.hiddenHostToTransformation = {};
    this.hostColors = {};
    this.color = d3.scale.category20();
}

Global.prototype.getHostColors = function() {
    var colors = {};
    for(var host in this.hostColors) {
        colors[host] = this.hostColors[host];
    }
    return colors;
};

Global.prototype.addTransformation = function(transformation) {
    this.transformations.push(transformation);
    this.drawAll();
};

Global.prototype.drawAll = function() {
    for(var i = 0; i < this.views.length; i++) {
        this.views[i].draw();
    }
    this.drawHiddenHosts();
    this.drawArrow();
};

Global.prototype.getTransformations = function() {
    return this.transformations.slice();
};

Global.prototype.hideHost = function(hostId) {
    var transform = new HideHostTransformation(hostId);
    this.hiddenHostToTransformation[hostId] = transform;
    this.hiddenHosts.push(hostId);
    this.addTransformation(transform);
};

Global.prototype.unhideHost = function(hostId) {
    this.hiddenHosts.splice(this.hiddenHosts.indexOf(hostId), 1);
    this.transformations.splice(this.transformations.indexOf(this.hiddenHostToTransformation[hostId]), 1);
    this.drawAll();
};

Global.prototype.getHiddenHosts = function() {
    return this.hiddenHosts.slice();
};

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
};


/**
 * Draws the hidden hosts, if any exist.
 */
Global.prototype.drawHiddenHosts = function() {
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