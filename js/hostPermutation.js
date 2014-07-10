
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

HostPermutation.prototype.addGraph = function(graph) {
    this.graphs.push(graph);
};

HostPermutation.prototype.getHosts = function() {
    return this.reverse ? this.hosts.slice().reverse() : this.hosts.slice();
};

HostPermutation.prototype.getHostsAndFilter = function(filter) {
    var filterSet = {};
    for(var i = 0; i < filter.length; i++) {
        filterSet[filter[i]] = true;
    }
    
    var ret = [];
    for(var i = 0; i < this.hosts.length; i++) {
        if(filterSet[this.hosts[i]]) {
            ret.push(this.hosts[i]);
        }
    }
    
    if(this.reverse) {
        ret.reverse();
    }
    
    return ret;
};

HostPermutation.prototype.getHostColor = function(host) {
    return this.hostColors[host];
};

HostPermutation.prototype.getHostColors = function(hosts) {
    var colors = {};
    for (var host in this.hostColors) {
        colors[host] = this.hostColors[host];
    }
    return colors;
};

HostPermutation.prototype.assignHostColors = function() {
    for(var i = 0; i < this.graphs.length; i++) {
        var graph = this.graphs[i];
        var hosts = graph.getHosts();
        
        for(var j = 0; j < hosts.length; j++) {
            var host = hosts[j];
            if (!this.hostColors[host]) {
                this.hostColors[host] = this.color(host);
            }
        }
    }
};

LengthPermutation.prototype = Object.create(HostPermutation.prototype);
LengthPermutation.prototype.constructor = LengthPermutation;

function LengthPermutation(reverse) {
    HostPermutation.call(this, reverse);
}

LengthPermutation.prototype.update = function() {
    
    this.assignHostColors();
    
    var currHosts = {};
    
    for(var i = 0; i < this.graphs.length; i++) {
        var graph = this.graphs[i];
        var hosts = graph.getHosts();
        
        for(var j = 0; j < hosts.length; j++) {
            var host = hosts[j];
            var curr = graph.getHead(host).getNext();
            var count = 0;
            while(!curr.isTail()) {
                count++;
                curr = curr.getNext();
            }
            
            if(!currHosts[host] || count > currHosts[host].count) {
                currHosts[host] = {
                        count: count,
                        host: host
                };
            }
            
        }
    }
    
    var hostArray = [];
    for(var key in currHosts) {
        hostArray.push(currHosts[key]);
    }
    
    hostArray.sort(function(a, b) {
        return a.count - b.count;
    });
    
    this.hosts = [];
    for(var i = 0; i < hostArray.length; i++) {
        this.hosts.push(hostArray[i].host);
    }
    
};


function LogOrderPermutation() {
    
}

function AutoPermutation() {
    
}
