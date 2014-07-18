/**
 * @clasdesc
 * 
 * A HostPermutation is responsible for determining the order in which hosts
 * should be displayed in the visualization of the graph. This class is also
 * responsible for determining the hosts' visualization's color. This is because
 * Shiviz always uses colors in a fixed order for consistency, so host color is
 * tied to host permutation.
 * 
 * Typical usage involves adding hosts to order using addGraph(), calling
 * update() to compute the ordering of hosts, and then using one of the getters
 * to retrieve the computed host color and order
 * 
 * HostPermutaion is an abstract class. To implement a specific permutation, a
 * class that extends HostPermutation should be written and the update method
 * should be overriden.
 * 
 * @constructor
 * @param {Boolean} reverse If true, the ordering of hosts is reversed
 */
function HostPermutation(reverse) {
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
}

/**
 * Adds a graph to the HostPermutation. HostPermutation determines an ordering
 * of hosts based on the hosts of graphs added using this method
 * 
 * @param {Graph} graph The graph to add
 */
HostPermutation.prototype.addGraph = function(graph) {
    this.graphs.push(graph);
};

/**
 * Gets a list of hosts in the order determined by the HostPermutation. Note
 * that you must call update() to compute the ordering of hosts before
 * retrieving it with this method
 * 
 * @returns {Array<String>} Array of hosts
 */
HostPermutation.prototype.getHosts = function() {
    return this.reverse ? this.hosts.slice().reverse() : this.hosts.slice();
};

/**
 * Gets a list of hosts in the order determined by the HostPermutation. Only
 * hosts contained in both this HostPermutation and the filter array will be
 * returned. Note that you must call update() to compute the ordering of hosts
 * before retrieving it with this method.
 * 
 * @param {Array<String>} filter The filter array.
 * @returns {Array<String>} Array of hosts
 */
HostPermutation.prototype.getHostsAndFilter = function(filter) {
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
    return this.hostColors[host];
};

/**
 * Returns all designated host colors
 * 
 * @returns {Object<String, String>} A mapping of host name to host color
 */
HostPermutation.prototype.getHostColors = function() {
    var colors = {};
    for (var host in this.hostColors) {
        colors[host] = this.hostColors[host];
    }
    return colors;
};

/**
 * @private
 */
HostPermutation.prototype.assignHostColors = function() {
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

LengthPermutation.prototype = Object.create(HostPermutation.prototype);
LengthPermutation.prototype.constructor = LengthPermutation;

/**
 * @classdesc
 * 
 * LengthPermutation arranges hosts based on the number of LogEvents the host
 * contains
 * 
 * @constructor
 * @param {Boolean} reverse
 */
function LengthPermutation(reverse) {
    HostPermutation.call(this, reverse);
}

LengthPermutation.prototype.update = function() {

    this.assignHostColors();

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

LogOrderPermutation.prototype = Object.create(HostPermutation.prototype);
LogOrderPermutation.prototype.constructor = LogOrderPermutation;

/**
 * @classdesc
 * 
 * LogOrderPermutation orders hosts based on the order they appear in logs
 * 
 * @constructor
 * @param {Boolean} reverse
 */
function LogOrderPermutation(reverse) {
    HostPermutation.call(this, reverse);

    /** @private */
    this.logs = [];
}

LogOrderPermutation.prototype.addLogs = function(logs) {
    this.logs = this.logs.concat(logs);
};

LogOrderPermutation.prototype.update = function() {
    this.assignHostColors();

    var hostSet = {};

    for (var i = 0; i < this.logs.length; i++) {
        var log = this.logs[i];
        if (!hostSet[log.getHost()]) {
            hostSet[log.getHost()] = true;
            this.hosts.push(log.getHost());
        }
    }
};
