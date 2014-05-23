function Graph(logEvents) {
  this.hosts = [];
  
  this.hostToHead = {};
  this.hostToTail = {};
  
  var hostToNodes = {};
  var hostSet = {};
  
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
      newNode.prev = lastNode;
      newNode.next = lastNode.next;
      
      newNode.prev.next = newNode;
      newNode.next.prev = newNode;
      
      lastNode = newNode;
    }
  }
  
  for(var host in hostSet) {
    var clock = {};
    var currNode = this.hostToHead[host].next;
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
      
      for(var key in connections) {
        currNode.addParent(connections[key]);
        connections[key].addChild(currNode);
      }
      
      currNode = currNode.next;
    }
  }
  
  // step through and validate
  
}

Graph.prototype.getHead = function(host) {
  if(!this.hostToHead[host]) {
    return null;
  }
  return this.hostToHead[host];
};

Graph.prototype.getTail = function(host) {
  if(!this.hostToTail[host]) {
    return null;
  }
  return this.hostToTail[host];
};

Graph.prototype.getHosts = function() {
  return this.hosts.slice(0);
};

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

Graph.prototype.getAllNodes = function() {
  return this.getNodes().concat(this.getDummyNodes());
};

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
