/**
 * A Graph contains the hosts and nodes tha make up
 * the model.
 * @param {LogEvent} logEvents an array of log events
 *                             extracted from the raw log
 *                             input
 */
function Graph(logEvents) {
  this.hosts = [];
  
  // Dictionaries linking the host name
  // to the head/tail dummy node for that host
  this.hostToHead = {};
  this.hostToTail = {};
  
  // Dictionary linking host name to array of
  // nodes
  var hostToNodes = {};
  // Set of existing hosts
  var hostSet = {};
  
  // Create and add nodes to host arrays.
  // Initialize hosts if undefined by adding them to hostSet
  // and assigning head and tail dummy nodes
  for(var i = 0; i < logEvents.length; i++) {
    var logEvent = logEvents[i];
    var host = logEvent.host;
    var node = new Node([logEvent], host);
    
    if(hostSet[host] == undefined) {
      hostSet[host] = true;
      this.hosts.push(host);
      hostToNodes[host] = [];
      
      var head = new Node([], host);
      head.isHeadInner = true;
      
      var tail = new Node([], host);
      tail.isTailInner = true;
      
      head.next = tail;
      tail.prev = head;
      
      this.hostToHead[host] = head;
      this.hostToTail[host] = tail;
    }
    
    hostToNodes[host].push(node);
  }
  
  // Sort the hosts by number of nodes descending
  this.hosts.sort(function(a, b) {
    return hostToNodes[b].length - hostToNodes[a].length;
  });
  
  // Generate linear model among nodes in same host;
  // links adjacent nodes together using prev/next fields
  for(var host in hostToNodes) {
    var array = hostToNodes[host];
    array.sort(function(a, b) {
      return a.logEvents[0].vectorTimestamp.compareToLocal(b.logEvents[0].vectorTimestamp);
    });
    
    for(var i = 0; i < array.length; i++) {
      if(array[i].logEvents[0].vectorTimestamp.ownTime != i + 1) {
        throw "Bad vector clock";
      }
    }

    var lastNode = this.hostToHead[host];
    for(var i = 0; i < array.length; i++) {
      var newNode = array[i];
      newNode.prev = lastNode;
      newNode.next = lastNode.next;
      
      newNode.prev.next = newNode;
      newNode.next.prev = newNode;
      
      lastNode = newNode;
    }
  }
  
  // Generates parent/child connections
  for(var host in hostSet) {
    // Latest clock
    var clock = {};
    var currNode = this.hostToHead[host].next;
    var tail = this.hostToTail[host];

    while(currNode != tail) {
      // Candidates is array of potential parents for
      // currNode
      var candidates = [];
      var currVT = currNode.logEvents[0].vectorTimestamp;
      clock[host] = currVT.ownTime;
      
      // Looks to see if a timestamp for a host in the
      // vector clock has been updated from the last one
      for(var otherHost in currVT.clock) {
        var time = currVT.clock[otherHost];
        
        // If the timestamp for the host has been updated
        // then add the node in otherHost with timestamp
        // time to the list of candidates
        if(clock[otherHost] == undefined || clock[otherHost] < time) {
          clock[otherHost] = time;
          
          if(hostSet[otherHost] == undefined)
            throw "Unrecognized host: " + otherHost;
          
          if(time < 1 || time > hostToNodes[otherHost].length)
            throw "Invalid vector clock time value";
          
          candidates.push(hostToNodes[otherHost][time - 1]);
        }
      }
      
      // Gather all candiates into connections
      var connections = {};
      for(var i = 0; i < candidates.length; i++) {
        var vt = candidates[i].logEvents[0].vectorTimestamp;
        var id = vt.host + ":" + vt.ownTime;
        connections[id] = candidates[i];
      }
      
      // Remove unnecessary connections (implicit
      // connections) e.g.
      //      a
      //     / \
      //    X  ,b
      //   / ,'
      //  c '
      // Where connection from a to c is implicit
      // (marked with an X)
      for(var i = 0; i < candidates.length; i++) {
        var vt = candidates[i].logEvents[0].vectorTimestamp;
        for(var otherHost in vt.clock) {
          if(otherHost != vt.host) {
            var id = otherHost + ":" + vt.clock[otherHost];
            delete connections[id];
          }
        }
      }
      
      // Add the parents
      for(var key in connections) {
        currNode.addParent(connections[key]);
      }
      
      currNode = currNode.next;
    }
  }
  
  // step through and validate
  
}

/**
 * Gets the head node for a host
 * @param  {String} host the name of the host
 * @return {Node}        the head node, or null if
 *                       none is found
 */
Graph.prototype.getHead = function(host) {
  if(!this.hostToHead[host]) {
    return null;
  }
  return this.hostToHead[host];
};

/**
 * Gets the tail node for a host
 * @param  {String} host the name of the host
 * @return {Node}        the tail node, or null if
 *                       none is found
 */
Graph.prototype.getTail = function(host) {
  if(!this.hostToTail[host]) {
    return null;
  }
  return this.hostToTail[host];
};

/**
 * Gets the hosts
 * @return {[String]} a copy of the array of host names
 */
Graph.prototype.getHosts = function() {
  return this.hosts.slice(0);
};

/**
 * Removes a node from the model
 * @param  {Node} node the node to remove
 */
Graph.prototype.removeNode = function(node) {
  if(node.prev == null || node.next == null) {
    return;
  }
  
  if(node.prev.next == node) {
    node.prev.next = node.next;
  }
  
  if(node.next.prev == node) {
    node.next.prev = node.prev;
  }
  
  for (var j = 0; j < node.parents.length; j++) {
    var parents = node.parents[j].children;
    parents.splice(parents.indexOf(node), 1);
  }
  
  for (var j = 0; j < node.children.length; j++) {
    var children = node.children[j].parents;
    children.splice(children.indexOf(node), 1);
  }
};

/**
 * Removes a host from the model.
 * Does not add transitive edges (see
 * HideHostTransformation instead)
 * @param  {String} host the name of the host to hide
 */
Graph.prototype.removeHost = function(host) {
  var index = this.hosts.indexOf(host);
  if (index > -1) {
    this.hosts.splice(index, 1);
  }
  
  var curr = this.hostToHead[host].next;
  var tail = this.hostToTail[host];
  
  while(curr != tail) {
    this.removeNode(curr);
    curr = curr.next;
  }
  
  delete this.hostToHead[host];
  delete this.hostToTail[host];
};

/**
 * Gets the non-dummy nodes
 * @return {[Node]} an array of all non-dummy nodes
 */
Graph.prototype.getNodes = function() {
  var nodes = [];
  for(var i = 0; i < this.hosts.length; i++) {
    var curr = this.getHead(this.hosts[i]).getNext();

    while(!curr.isTail()) {
      nodes.push(curr);
      curr = curr.getNext();
    }
  }
  return nodes;
};

/**
 * Gets the dummy (head/tail) nodes
 * @return {[Node]} an array of all dummy nodes
 */
Graph.prototype.getDummyNodes = function() {
  var nodes = [];
  for(var host in this.hostToHead) {
    nodes.push(this.hostToHead[host]);
  }
  
  for(var host in this.hostToTail) {
    nodes.push(this.hostToTail[host]);
  }
  return nodes;
};

/**
 * Gets all nodes including dummy nodes
 * @return {[Node]} an array of all nodes in the model
 */
Graph.prototype.getAllNodes = function() {
  return this.getNodes().concat(this.getDummyNodes());
};

/**
 * Clones the graph
 * @return {Graph} a clone of the graph
 */
Graph.prototype.clone = function() {
  var newGraph = new Graph([]);
  newGraph.hosts = [].concat(this.hosts);
  
  var allNodes = this.getAllNodes();
  
  var oldToNewNode = {};
  for(var i = 0; i < allNodes.length; i++) {
    var node = allNodes[i];
    oldToNewNode[node.id] = node.clone();
  }
  
  for(var host in this.hostToHead) {
    var node = this.hostToHead[host];
    newGraph.hostToHead[host] = oldToNewNode[node.id];
  }
  
  for(var host in this.hostToTail) {
    var node = this.hostToTail[host];
    newGraph.hostToTail[host] = oldToNewNode[node.id];
  }
  
  for(var i = 0; i < allNodes.length; i++) {
    var node = allNodes[i];
    var newNode = oldToNewNode[node.id];
    
    if(node.prev != null) {
      newNode.prev = oldToNewNode[node.prev.id];
    }
    
    if(node.next != null) {
      newNode.next = oldToNewNode[node.next.id];
    }
    
    for (var j = 0; j < node.parents.length; j++) {
      newNode.addParent(oldToNewNode[node.parents[j].id]);
    }

    for (var j = 0; j < node.children.length; j++) {
      newNode.addChild(oldToNewNode[node.children[j].id]);
    }
  }

  return newGraph;
};