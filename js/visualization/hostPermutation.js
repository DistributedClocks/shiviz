/**
 * The constructor for this abstract class will typically be invoked by concrete
 * sub-classes
 * 
 * @clasdesc
 * 
 * <p>
 * A HostPermutation is responsible for determining the order in which hosts
 * should be displayed in the visualization of the graph. This class is also
 * responsible for determining the hosts' visualization's color. This is because
 * Shiviz always uses colors in a fixed order for consistency, so host color is
 * tied to host permutation.
 * </p>
 * 
 * <p>
 * Typical usage involves adding hosts to order using
 * {@link HostPermutation#addGraph}, calling {@link HostPermutation#update} to
 * compute the ordering of hosts, and then using one of the getters to retrieve
 * the computed host color and order.
 * </p>
 * 
 * <p>
 * HostPermutation and all its subclasses must ensure that the computed host
 * order and colors do not change unless {@link HostPermutation#update} is
 * called. Before the very first time update is called, do not try to retrieve
 * the computed host color and order (i.e by using
 * {@link HostPermutation#getHosts}, etc)
 * </p>
 * 
 * <p>
 * HostPermutation is an abstract class. To implement a specific permutation, a
 * class that extends HostPermutation should be written and the
 * {@link HostPermutation#update} method should be overriden.
 * </p>
 * 
 * @constructor
 * @abstract
 * @param {Boolean} reverse If true, the ordering of hosts is reversed
 */
function HostPermutation(reverse) {

    if (this.constructor == HostPermutation) {
        throw new Exception("Cannot instantiate HostPermutation; HostPermutation is an abstract class");
    }

    /** @private */
    this.graphs = [];

    /** @private */
    this.hosts = [];

    /** @private */
    this.reverse = reverse;

    /** @private */
    this.color = d3.scale.category20();

    /** @private */
    this.hostColors = {};

    /** @private */
    this.hasUpdated = false;
}

/**
 * Adds a graph to the HostPermutation. HostPermutation determines an ordering
 * of hosts based on the hosts of graphs added using this method
 * 
 * @param {ModelGraph} graph The graph to add
 */
HostPermutation.prototype.addGraph = function(graph) {
    this.graphs.push(graph);
};

/**
 * Gets a list of hosts in the order determined by the HostPermutation. Note
 * that you must call {@link update} to compute the ordering of hosts before
 * retrieving it with this method
 * 
 * @returns {Array<String>} Array of hosts
 */
HostPermutation.prototype.getHosts = function() {
    if (!this.hasUpdated) {
        throw new Exception("HostPermutation.prototype.getHosts: You must call update() first");
    }
    return this.reverse ? this.hosts.slice().reverse() : this.hosts.slice();
};

/**
 * Gets a list of hosts in the order determined by the HostPermutation. Only
 * hosts contained in both this HostPermutation and the filter array will be
 * returned. Note that you must call {@link update} to compute the ordering of
 * hosts before retrieving it with this method.
 * 
 * @param {Array<String>} filter The filter array.
 * @returns {Array<String>} Array of hosts
 */
HostPermutation.prototype.getHostsAndFilter = function(filter) {
    if (!this.hasUpdated) {
        throw new Exception("HostPermutation.prototype.getHosts: You must call update() first");
    }

    var filterSet = {};
    for (var i = 0; i < filter.length; i++) {
        filterSet[filter[i]] = true;
    }

    var ret = [];
    for (var i = 0; i < this.hosts.length; i++) {
        if (filterSet[this.hosts[i]]) {
            ret.push(this.hosts[i]);
        }
    }

    if (this.reverse) {
        ret.reverse();
    }

    return ret;
};

/**
 * Gets the designated color of the specified host
 * 
 * @param {String} host The host whose color you want to retrieve
 * @returns {String} A valid color string.
 */
HostPermutation.prototype.getHostColor = function(host) {
    if (!this.hasUpdated) {
        throw new Exception("HostPermutation.prototype.getHosts: You must call update() first");
    }

    return this.hostColors[host];
};

/**
 * Returns all designated host colors
 * 
 * @returns {Object<String, String>} A mapping of host name to host color
 */
HostPermutation.prototype.getHostColors = function() {
    if (!this.hasUpdated) {
        throw new Exception("HostPermutation.prototype.getHosts: You must call update() first");
    }

    var colors = {};
    for (var host in this.hostColors) {
        colors[host] = this.hostColors[host];
    }
    return colors;
};

/**
 * <p>
 * The update method alone is responsible for figuring out the ordering of hosts
 * and for assigning host colors.
 * </p>
 * 
 * <p>
 * In its current form, because it is an abstract method, it only performs color
 * assignment. Classes that extend HostPermutation must be sure to override this
 * method and extend it with host permutation assignment functionality.
 * </p>
 * 
 * @abstract
 */
HostPermutation.prototype.update = function() {

    this.hasUpdated = true;

    for (var i = 0; i < this.graphs.length; i++) {
        var graph = this.graphs[i];
        var hosts = graph.getHosts();

        for (var j = 0; j < hosts.length; j++) {
            var host = hosts[j];
            if (!this.hostColors[host]) {
                this.hostColors[host] = this.color(host);
            }
        }
    }

};

/**
 * Constructs a LengthPermutation
 * 
 * @classdesc
 * 
 * LengthPermutation arranges hosts in ascending order based on the number of
 * LogEvents the host contains.
 * 
 * @constructor
 * @extends HostPermutation
 * @param {Boolean} reverse If true, the ordering of hosts is reversed
 */
function LengthPermutation(reverse) {
    HostPermutation.call(this, reverse);
}

// LengthPermutation extends HostPermutation
LengthPermutation.prototype = Object.create(HostPermutation.prototype);
LengthPermutation.prototype.constructor = LengthPermutation;

/**
 * Overrides {@link HostPermutation#update}
 */
LengthPermutation.prototype.update = function() {

    HostPermutation.prototype.update.call(this);

    var currHosts = {};

    for (var i = 0; i < this.graphs.length; i++) {
        var graph = this.graphs[i];
        var hosts = graph.getHosts();

        for (var j = 0; j < hosts.length; j++) {
            var host = hosts[j];
            var curr = graph.getHead(host).getNext();
            var count = 0;
            while (!curr.isTail()) {
                count++;
                curr = curr.getNext();
            }

            if (!currHosts[host] || count > currHosts[host].count) {
                currHosts[host] = {
                    count: count,
                    host: host
                };
            }

        }
    }

    var hostArray = [];
    for (var key in currHosts) {
        hostArray.push(currHosts[key]);
    }

    hostArray.sort(function(a, b) {
        return a.count - b.count;
    });

    this.hosts = [];
    for (var i = 0; i < hostArray.length; i++) {
        this.hosts.push(hostArray[i].host);
    }

};

/**
 * Constructs a LogOrderPermutation
 * 
 * @classdesc
 * 
 * LogOrderPermutation orders hosts based on the order they appear in logs.
 * 
 * @constructor
 * @extends HostPermutation
 * @param {Boolean} reverse If true, the ordering of hosts is reversed
 */
function LogOrderPermutation(reverse) {
    HostPermutation.call(this, reverse);

    /** @private */
    this.logs = [];
}

// LogOrderPermutation extends HostPermutation
LogOrderPermutation.prototype = Object.create(HostPermutation.prototype);
LogOrderPermutation.prototype.constructor = LogOrderPermutation;

/**
 * Adds logs. This class will order hosts based on the order they appear in the
 * logs provided.
 * 
 * @param {Array<LogEvent>} logs The logs to add
 */
LogOrderPermutation.prototype.addLogs = function(logs) {
    this.logs = this.logs.concat(logs);
};

/**
 * Overrides {@link HostPermutation#update}
 */
LogOrderPermutation.prototype.update = function() {

    HostPermutation.prototype.update.call(this);

    var hostSet = {};

    for (var i = 0; i < this.logs.length; i++) {
        var log = this.logs[i];
        if (!hostSet[log.getHost()]) {
            hostSet[log.getHost()] = true;
            this.hosts.push(log.getHost());
        }
    }
};
