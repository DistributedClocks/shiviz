Node.number = 0;

function Node(logEvents, host) {
  this.id = Node.number++;
  this.parent = null;
  this.child = null;
  this.afterNode = null;
  this.beforeNode = null;
  
  this.logEvents = logEvents;
  this.host = host;
}

Node.prototype.getConnections = function() {
  return [this.parent, this.child, this.afterNode, this.beforeNode];
};


function Graph(logEvents) {
  this.nodes = {};
  this.hosts = [];
  
//  this.dummyNodes = [];
  this.hostToHead = {};
  this.hostToTail = {};
  
  this.previousGraph = null;
  
  var hostToNodes = {};
  var hostSet = {};
  
  for(var i = 0; i < logEvents.length; i++) {
    var logEvent = logEvents[i];
    var host = logEvent.host;
    var node = new Node([logEvent], host);
    this.nodes[node.id] = node;
    
    if(hostSet[host] == undefined) {
      hostSet[host] = true;
      this.hosts.push(host);
      hostToNodes[host] = [];
      
      var head = new Node([], host);
      var tail = new Node([], host);
      head.child = tail;
      tail.parent = head;
      
//      dummyNodes.push(head);
//      dummyNodes.push(tail);
      this.hostToHead[host] = head;
      this.hostToTail[host] = tail;
    }
    
    hostToNodes[host].push(node);
  }
  
  this.hosts.sort(function(a, b) {
    return hostToNodes[a].length - hostToNodes[b].length;
  });
  
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
      newNode.parent = lastNode;
      newNode.child = lastNode.child;
      
      newNode.parent.child = newNode;
      newNode.child.parent = newNode;
      
      lastNode = newNode;
    }
  }
  
  for(var host in hostSet) {
    var clock = {};
    var currNode = this.hostToHead[host].child;
    var tail = this.hostToTail[host];
    while(currNode != tail) {
      
      var candidates = [];
      var currVT = currNode.logEvents[0].vectorTimestamp;
      clock[host] = currVT.ownTime;
      
      for(var otherHost in currVT.clock) {
        var time = currVT.clock[otherHost];
        
        if(clock[otherHost] == undefined || clock[otherHost] < time) {
          clock[otherHost] = time;
          
          if(hostSet[otherHost] == undefined) {
            throw "Unrecognized host: " + otherHost;
          }
          
          if(time < 1 || time > hostToNodes[otherHost].length) {
            throw "Invalid vector clock time value";
          }
          
          candidates.push(hostToNodes[otherHost][time - 1]);
        }
      }
      
      var connections = {};
      for(var i = 0; i < candidates.length; i++) {
        var vt = candidates[i].logEvents[0].vectorTimestamp;
        var id = vt.host + ":" + vt.ownTime;
        connections[id] = candidates[i];
      }
      
      for(var i = 0; i < candidates.length; i++) {
        var vt = candidates[i].logEvents[0].vectorTimestamp;
        for(var otherHost in vt.clock) {
          if(otherHost != vt.host) {
            var id = otherHost + ":" + vt.clock[otherHost];
            delete connections[id];
          }
        }
      }
      
      var finalConnections = [];
      for(var key in connections) {
        finalConnections.push(connections[key]);
      }
      
      if(finalConnections.length > 1) {
        throw "Node has too many connections";
      }
      
      if(finalConnections.length == 1) {
        currNode.beforeNode = finalConnections[0];
        finalConnections[0].afterNode = currNode;
      }
      
      currNode = currNode.child;
    }
  }
  
  // step through and validate
  
}

Graph.prototype.removeNode = function(node) {
  if(node.parent == null || node.child == null) {
    return;
  }
  
  node.parent.child = node.child;
  node.child.parent = node.parent;
  delete nodes[node.id];
};

Graph.prototype.applyTransform = function(transform) {
  var newGraph = this.clone();
  newGraph.previousGraph = this;
  transform.transform(newGraph);
};

Graph.prototype.clone = function() {
  var newGraph = new Graph([]);
  newGraph.hosts = this.hosts;
  
  var oldToNewNode = {};
  for(var node in this.nodes) {
    oldToNewNode[node.id] = new Node(node.logEvents, node.host);
  }
  
  for(var node in this.nodes) {
    var newNode = oldToNewNode[node.id];
    newNode.parent = oldToNewNode[node.parent.id];
    newNode.child = oldToNewNode[node.child.id];
    
    if(node.beforeNode != null) {
      newNode.beforeNode = oldToNewNode[node.beforeNode.id];
    }
    
    if(node.afterNode != null) {
      newNode.afterNode = oldToNewNode[node.afterNode.id];
    }
  }
  
  for(var host in this.hostToHead) {
    var curr = this.hostToHead[host];
    var newNode = new Node(curr.logEvents, curr.host);
    newNode.child = oldToNewNode[curr.child.id];
    newGraph.hostToHead[host] = newNode;
  }
  
  for(var host in this.hostToHead) {
    var curr = this.hostToHead[host];
    var newNode = new Node(curr.logEvents, curr.host);
    newNode.child = oldToNewNode[curr.child.id];
    newGraph.hostToHead[host] = newNode;
  }
  
  for(var host in this.hostToTail) {
    var curr = this.hostToTail[host];
    var newNode = new Node(curr.logEvents, curr.host);
    newNode.parent = oldToNewNode[curr.parent.id];
    newGraph.hostToTail[host] = newNode;
  }
  
  newGraph.previousGraph = this.previousGraph;
};
