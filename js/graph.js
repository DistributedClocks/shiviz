/**
 * A Graph contains the hosts and nodes that makes up the model.
 * 
 * A Graph can be thought of as a set of augmented linked-lists. Each host is
 * associated with a linked-list that is "augmented" in the sense that each node
 * can also be connected to nodes in other linked lists. The first and last
 * nodes in each linked list are dummy head and tail nodes respectively.
 * 
 * Traversing a Graph is much like traversing a linked list. For example, to
 * visit all nodes whose host is equal to "loadBalancer":
 * 
 * <pre>
 * var currentNode = this.getHeadByHost('loadBalancer').getNext();
 * while (!currentNode.isTail()) {
 *   // do something to currentNode
 *   currentNode = currentNode.getNext();
 * }
 * </pre>
 */

/**
 * @constructor
 * @param {[LogEvent]} logEvents an array of log events extracted from the raw
 *          log input
 */
function Graph(logEvents) {
  /** @private */
  this.hosts = [];

  // Dictionaries linking the host name to the head/tail node for that host
  /** @private */
  this.hostToHead = {};

  /** @private */
  this.hostToTail = {};

  // Dictionary linking host name to array of nodes
  /** @private */
  var hostToNodes = {};

  // Set of existing hosts
  /** @private */
  var hostSet = {};

  /*
   * Create and add nodes to host arrays. Initialize hosts if undefined by
   * adding them to hostSet and assigning head and tail dummy nodes
   */
  for ( var i = 0; i < logEvents.length; i++) {
    var logEvent = logEvents[i];
    var host = logEvent.host;
    var node = new Node([ logEvent ], host);

    if (hostSet[host] == undefined) {
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

  // Generate linear linked list among nodes in same host
  for ( var host in hostToNodes) {
    var array = hostToNodes[host];
    array.sort(function(a, b) {
      return a.logEvents[0].vectorTimestamp
          .compareToLocal(b.logEvents[0].vectorTimestamp);
    });

    for ( var i = 0; i < array.length; i++) {
      if (array[i].logEvents[0].vectorTimestamp.ownTime != i + 1) {
        throw "Bad vector clock";
      }
    }

    var lastNode = this.hostToHead[host];
    for ( var i = 0; i < array.length; i++) {
      var newNode = array[i];
      lastNode.insertNext(newNode);
      lastNode = newNode;
    }
  }

  // Generates parent/child connections
  for ( var host in hostSet) {
    // Latest clock
    var clock = {};
    var currNode = this.hostToHead[host].next;
    var tail = this.hostToTail[host];

    while (currNode != tail) {
      // Candidates is array of potential parents for
      // currNode
      var candidates = [];
      var currVT = currNode.logEvents[0].vectorTimestamp;
      clock[host] = currVT.ownTime;

      // Looks to see if a timestamp for a host in the
      // vector clock has been updated from the last one
      for ( var otherHost in currVT.clock) {
        var time = currVT.clock[otherHost];

        // If the timestamp for the host has been updated
        // then add the node in otherHost with timestamp
        // time to the list of candidates
        if (clock[otherHost] == undefined || clock[otherHost] < time) {
          clock[otherHost] = time;

          if (hostSet[otherHost] == undefined)
            throw "Unrecognized host: " + otherHost;

          if (time < 1 || time > hostToNodes[otherHost].length)
            throw "Invalid vector clock time value";

          candidates.push(hostToNodes[otherHost][time - 1]);
        }
      }

      // Gather all candidates into connections
      var connections = {};
      for ( var i = 0; i < candidates.length; i++) {
        var vt = candidates[i].logEvents[0].vectorTimestamp;
        var id = vt.host + ":" + vt.ownTime;
        connections[id] = candidates[i];
      }

      for ( var i = 0; i < candidates.length; i++) {
        var vt = candidates[i].logEvents[0].vectorTimestamp;
        for ( var otherHost in vt.clock) {
          if (otherHost != vt.host) {
            var id = otherHost + ":" + vt.clock[otherHost];
            delete connections[id];
          }
        }
      }

      // figure out which child to keep
      for ( var key in connections) {
        var node = connections[key];
        var currParentOnHost = currNode.hostToParent[node.getHost()];
        if (!currParentOnHost) {
          currNode.addParent(node);
          continue;
        }
        var newTime = node.getLogEvents()[0].vectorTimestamp.ownTime;
        var oldTime = currParentOnHost.getLogEvents()[0].vectorTimestamp.ownTime;
        if (newTime > oldTime) {
          currNode.addParent(node);
        }

      }

      currNode = currNode.next;
    }
  }

}

/**
 * Gets the head node for a host
 * 
 * @param {String} host the name of the host
 * @return {Node} the head node, or null if none is found
 */
Graph.prototype.getHead = function(host) {
  if (!this.hostToHead[host]) {
    return null;
  }
  return this.hostToHead[host];
};

/**
 * Gets the tail node for a host
 * 
 * @param {String} host the name of the host
 * @return {Node} the tail node, or null if none is found
 */
Graph.prototype.getTail = function(host) {
  if (!this.hostToTail[host]) {
    return null;
  }
  return this.hostToTail[host];
};

/**
 * Gets the hosts as an array
 * 
 * @return {[String]} a copy of the array of host names
 */
Graph.prototype.getHosts = function() {
  return this.hosts.slice(0);
};

/**
 * Removes a host from the model. All connections to and from this host will be
 * removed. The host must be a valid host in the current Graph.
 * 
 * @param {String} host the name of the host to hide
 */
Graph.prototype.removeHost = function(host) {
  var index = this.hosts.indexOf(host);
  if (index < 0) {
    throw "Host not found: " + host;
  }

  this.hosts.splice(index, 1);

  var curr = this.getHead(host).getNext();
  while (!curr.isTail()) {
    var next = curr.getNext();
    curr.remove();
    curr = next;

  }

  delete this.hostToHead[host];
  delete this.hostToTail[host];
};

/**
 * Gets the non-dummy (i.e non-head and non-tail) nodes
 * 
 * @return {[Node]} an array of all non-dummy nodes
 */
Graph.prototype.getNodes = function() {
  var nodes = [];
  for ( var i = 0; i < this.hosts.length; i++) {
    var curr = this.getHead(this.hosts[i]).getNext();

    while (!curr.isTail()) {
      nodes.push(curr);
      curr = curr.getNext();
    }
  }
  return nodes;
};

/**
 * Gets the dummy (head/tail) nodes
 * 
 * @return {[Node]} an array of all dummy nodes
 */
Graph.prototype.getDummyNodes = function() {
  var nodes = [];
  for ( var host in this.hostToHead) {
    nodes.push(this.hostToHead[host]);
  }

  for ( var host in this.hostToTail) {
    nodes.push(this.hostToTail[host]);
  }
  return nodes;
};

/**
 * Gets all nodes including dummy nodes
 * 
 * @return {[Node]} an array of all nodes in the model
 */
Graph.prototype.getAllNodes = function() {
  return this.getNodes().concat(this.getDummyNodes());
};

/**
 * Returns a shallow
 * 
 * @return {Graph} a shallow copy of the graph
 */
Graph.prototype.clone = function() {
  var newGraph = new Graph([]);
  newGraph.hosts = this.getHosts();

  var allNodes = this.getAllNodes();
  var oldToNewNode = {};
  for ( var i = 0; i < allNodes.length; i++) {
    var node = allNodes[i];
    oldToNewNode[node.id] = node.clone();
  }

  for ( var host in this.hostToHead) {
    var node = this.hostToHead[host];
    newGraph.hostToHead[host] = oldToNewNode[node.id];
  }

  for ( var host in this.hostToTail) {
    var node = this.hostToTail[host];
    newGraph.hostToTail[host] = oldToNewNode[node.id];
  }

  for ( var i = 0; i < allNodes.length; i++) {
    var node = allNodes[i];
    var newNode = oldToNewNode[node.id];

    if (node.prev != null) {
      newNode.prev = oldToNewNode[node.prev.id];
    }

    if (node.next != null) {
      newNode.next = oldToNewNode[node.next.id];
    }

    var children = node.getChildren();
    for(var j = 0; j < children.length; j++) {
      var child = children[j];
      newNode.addChild(oldToNewNode[child.id]);
    }

  }

  return newGraph;
};