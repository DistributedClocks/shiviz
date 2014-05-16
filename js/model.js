/**
 * The model. Consists of a mapping from hostId --> time --> Node.
 */
function Graph() {
  this.hosts = {};
  this.edges = {};

  this.sortedHosts = null;
}

/**
 * Clones this Graph object. Maintains references to the original (static) Node
 * objects but performs a deep copy of the (dynamic) edge objects.
 */
Graph.prototype.clone = function() {
  var other = new Graph();
  other.hosts = clone(this.hosts);
  other.edges = deepCopy(this.edges);
  return other;
}

/**
 * Returns the node that occurred on the given host at the given (local) time,
 * or null if no such node exists.
 */
Graph.prototype.getNode = function(hostId, time) {
  if (!this.hosts.hasOwnProperty(hostId)) {
    return null;
  }

  var node = this.hosts[hostId][time];
  if (node === undefined) {
    return null;
  }
  return node;
}

/**
 * Returns the next node that occurred at the (local) start time or later on the
 * given host, or null if no such node exists.
 */
Graph.prototype.getNextNode = function(hostId, startTime) {
  if (!this.hosts.hasOwnProperty(hostId)) {
    return null;
  }

  var candidate = this.getNode(hostId, startTime);
  if (candidate == null) {
    var arr = this.hosts[hostId]['times'];
    if (!this.hosts[hostId]['sorted']) {
      this.hosts[hostId]['sorted'] = true;
      arr.sort();
    }
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > startTime) {
        return this.getNode(hostId, arr[i]);
      }
    }
  }
  return candidate;
}

/**
 * Adds a Node to this Graph.
 */
Graph.prototype.addNode = function(node) {
  var hostId = node.hostId;
  var time = node.time;
  if (!this.hosts.hasOwnProperty(hostId)) {
    this.hosts[hostId] = {};
    this.hosts[hostId]['times'] = [];
  }
  this.hosts[hostId][time] = node;
  this.hosts[hostId]['times'].push(time);
  this.hosts[hostId]['sorted'] = false;

  this.edges[node.id()] = {};
  this.edges[node.id()]['parents'] = {};
  this.edges[node.id()]['children'] = {};
}

Graph.prototype.removeNode = function(node) {
  var hostId = node.hostId;
  var time = node.time;

  delete this.hosts[hostId][time];
  var index = this.hosts[hostId]['times'].indexOf(time);
  if (index > -1) {
    this.hosts[hostId]['times'].splice(index, 1);
  }
  this.hosts[hostId]['sorted'] = false;
  
  var parent = this.edges[node.id()]['parents'][hostId];
  var child = this.edges[node.id()]['children'][hostId];
  
  if(child == undefined && parent != undefined) {
    delete this.edges[hostId + ":" + parent]['children'][hostId];
  }
  else if(parent == undefined && child != undefined) {
    delete this.edges[hostId + ":" + child]['parents'][hostId];
  }
  else if(parent != undefined && child != undefined) {
    this.edges[hostId + ":" + parent]['children'][hostId] = child;
    this.edges[hostId + ":" + child]['parents'][hostId] = parent;
  }

  for(var host in this.edges[node.id()]['parents']) {
    if(host == hostId) {
      continue;
    }
    var id = this.edges[node.id()]['parents'][host];
    delete this.edges[host + ":" + id]['children'][hostId];
  }
  
  for(var host in this.edges[node.id()]['children']) {
    if(host == hostId) {
      continue;
    }
    var id = this.edges[node.id()]['children'][host];
    delete this.edges[host + ":" + id]['parents'][hostId];
  }

  delete this.edges[node.id()];

};

/**
 * Returns an array of the hosts in this Graph sorted by decreasing number of events.
 */
Graph.prototype.getSortedHosts = function () {
  if (this.sortedHosts == null) {
    var hostCopy = this.hosts;
    this.sortedHosts = this.getHosts().sort(function(a, b) {
      return hostCopy[b]['times'].length - hostCopy[a]['times'].length;
    });
  }
  return this.sortedHosts;
}

/**
 * returns an array of ids of all the hosts 
 */
Graph.prototype.getHosts = function() {
  return Object.keys(this.hosts);
}

/**
 * returns array of all the final node for each process 
 */
Graph.prototype.getLastNodeOfAllHosts = function() {
  var lastnodes = {};
  for(var key in this.hosts) {
    lastnodes[key] = this.hosts[key][this.hosts[key].times.length-1];
  }
  return lastnodes;
};


/**
 * Generates an object literal for this model, required by d3 for visualization.
 */
Graph.prototype.toLiteral = function() {
  var literal = {};

  // d3 assumes that edges will be represented by src, dest pairs identifying
  // indices defined by the order in which nodes appear in the nodes literal. To
  // make this happen, we'll track the index of each node while building the
  // nodes literal and use those indices while building the links literal.
  var indices = {};
  literal["nodes"] = this.getNodeLiteral(indices);
  literal["links"] = this.getEdgeLiteral(indices);
  literal["hosts"] = this.getSortedHosts(); 
  return literal;
}

/**
 * Generates a set of literal nodes
 */
Graph.prototype.getNodeLiteral = function(indices) {
  var literal = [];
  var index = 0;
  for (var host in this.hosts) {
    var arr = this.hosts[host]['times'];
    for (var i = 0; i < arr.length; i++) {
      var obj = this.getNode(host, arr[i]);
      var node = {};
      node["modelNode"] = obj; 
      node["name"] = obj.logEvent;
      node["group"] = host;
      if (obj.time == 0) {
        node["startNode"] = true;
      }
      node["line"] = obj.lineNum;
      indices[obj.id()] = index;
      index += 1;
      literal.push(node);
    }
  }
  return literal;
}

/**
 * Generates a set of literal edges
 */
Graph.prototype.getEdgeLiteral = function(indices) {
  var literal = [];

  for (var nodeId in this.edges) {
    for (var host in this.edges[nodeId]['children']) {
      var edge = {};
      edge["source"] = indices[nodeId];
      edge["target"] = indices[host + ":" + this.edges[nodeId]['children'][host]];
      literal.push(edge);
    }
  }
  return literal;
}

/**
 * Node class
 */
function Node(logEvent, hostId, clock, lineNum) {
  this.logEvent = logEvent;    // Log line this node represents
  this.hostId = hostId;        // Id of the host on which this event occurred
  this.clock = clock;          // Timestamp mapping from hostId to logical time
  this.lineNum = lineNum || 0; // Line number of our log event
  this.time = clock[hostId];    // Local time for this event
}

/**
 * Returns a unique id for this Node, in the form hostId:localTime.
 */
Node.prototype.id = function() {
  return this.hostId + ":" + this.time;
}

/**
 * Adds an edge from src to dest with the condition that src is the latest
 * possible parent for dest from the src host and dest is the earliest possible
 * child for src from dest's host.
 *
 * Edges is a map nodeId --> 'parents' --> host --> time and
 *                nodeId --> 'children' --> host --> time
 */
Graph.prototype.addEdge = function(src, dest) {
  // Add child to src's children object
  var childHost = dest.hostId;
  var children = this.edges[src.id()]['children'];
  if (!children.hasOwnProperty(childHost) ||
      children[childHost] > dest.time) {
    children[childHost] = dest.time;
  }

  // Add parent to dest's parents object
  var parentHost = src.hostId;
  var parents = this.edges[dest.id()]['parents'];
  if (!parents.hasOwnProperty(parentHost) ||
      parents[parentHost] < src.time) {
    parents[parentHost] = src.time;
  }
}

/**
 * Superficial copy of obj, keeps references to obj's object properties.
 */
function clone(obj) {
    if (null == obj || "object" != typeof obj) {
      return obj;
    }
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = obj[attr];
        }
    }
    return copy;
}

/**
 * Deep copy (recursive) of obj.
 */
function deepCopy(obj) {
    if (null == obj || "object" != typeof obj) {
      return obj;
    }
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = deepCopy(obj[attr]);
        }
    }
    return copy;
}
