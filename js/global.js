function Global() {
    this.hosts = [];
    this.views = [];
    this.transformations = [];
    this.hiddenHosts = [];
    this.hostColors = {};
}

/**
 * Concatenate given hosts to current array
 */
Global.prototype.addHosts = function(hosts) {
    this.hosts = this.hosts.concat(hosts);
};

/**
 * Add given view to current array
 */
Global.prototype.addView = function(view) {
    this.views.push(view);
};

/**
 * Redraw all the views
 */
Global.prototype.drawAll = function() {
    this.views.forEach(function(v) {
        v.draw();
    });
};

/**
 * Applies transformations to all views
 */
Global.prototype.applyTransformations = function() {
    this.views.forEach(function(v) {
        v.applyTransformations();
    });
};

/**
 * Set the colors for all the hosts Moved from View so hosts across executions
 * have distinct colors
 */
Global.prototype.setColors = function() {
    var hosts = this.hosts;
    var color = d3.scale.category20();
    for (var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        this.hostColors[host] = color(host);
    }
};