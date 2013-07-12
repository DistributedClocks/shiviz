/**
 * Graph class
 */
function Graph() {
  this.nodes = new Nodes();
  this.edges = new Edges();
  this.hasEdges = false;
}

Graph.prototype.toLiteral = function(hiddenHosts) {
  if (!this.hasEdges) {
    console.log("error, cannot return literal -- edges not generated"); 
    return {}; 
  }
  hiddenHosts = hiddenHosts || [];

  var literal = {};
  literal["nodes"] = this.nodes.toLiteral(hiddenHosts);
  literal["links"] = this.edges.toLiteral(hiddenHosts, this.nodes);
 
  var sortedHosts = this.nodes.getSortedHosts();
  for (var i = 0; i < hiddenHosts.length; i++) {
    sortedHosts.splice(sortedHosts.indexOf(hiddenHosts[i]), 1);
  }
  literal["hosts"] = sortedHosts; 
  return literal;
}

Graph.prototype.generateEdges = function() {
  if (this.hasEdges) {
    console.log("error, edges should not be generated twice");
    return;
  }
  this.hasEdges = true;

  var hosts = this.nodes.getHosts();
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    //var name = "Host: " + host.substring(host.indexOf("[") + 1, host.indexOf("]"));
    var name = "Host: " + host;
    var startClock = {};
    startClock[host] = 0;
    var startNode = new Node(name, host, startClock);
    this.nodes.add(startNode);
  }

  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    var clock = {};
    var curNode = this.nodes.get(host, 0);
    var prevNode = null;
    while (curNode != null) {
      if (prevNode != null) {
        // curNode has a parent on this host
        prevNode.addChild(curNode);
        curNode.addParent(prevNode);
      }
      clock[host] = curNode.getTime();
      var candidates = [];
      var curClock = curNode.getClock();
      for (var otherHost in curClock) {
        var time = curClock[otherHost];
        if (!clock.hasOwnProperty(otherHost) || clock[otherHost] < time) {
          // This otherHost may be a parent
          clock[otherHost] = time;
          var candidate = this.nodes.get(otherHost, time);
          candidates.push(candidate);
        }
      }

      // Determine which of candidates are 'necessary'
      var sourceNodes = {}; 
      for (var j = 0; j < candidates.length; j++) {
        var candidate = candidates[j];
        sourceNodes[candidate.id()] = candidate;
      }

      for (var j = 0; j < candidates.length; j++) {
        canClock = candidates[j].getClock();
        for (var otherHost in canClock) {
          if (otherHost != candidates[j].getHostId()) {
            var id = otherHost + ":" + canClock[otherHost];
            delete sourceNodes[id];
          }
        }
      }

      for (var id in sourceNodes) {
        sourceNodes[id].addChild(curNode);
        curNode.addParent(sourceNodes[id]);
      }

      prevNode = curNode;
      curNode = this.nodes.getNext(host, curNode.getTime() + 1);
    }
  }
  return this;
}

/**
 * Nodes container
 */
function Nodes() {
  this.hosts = {};
}

Nodes.prototype.toLiteral = function(hiddenHosts) {
  var literal = [];
  var index = 0;
  for (var host in this.hosts) {
    var curNode = this.get(host, 0);
    while (curNode != null) {
      curNode.clearLayoutState();
      curNode = this.get(host, curNode.getTime() + 1);
    }
  }
  for (var host in this.hosts) {
    if (hiddenHosts.indexOf(host) >= 0) {
      continue;
    }
    var arr = this.hosts[host]['times'];
    for (var i = 0; i < arr.length; i++) {
      var obj = this.get(host, arr[i]);
/*      if (obj.isCollapsed()) {
        continue;
      }*/
      var node = {};
      node["name"] = obj.getLog();
      node["group"] = host;
      if (obj.getTime() == 0) {
        node["startNode"] = true;
      }
      node["line"] = obj.getLine();
      obj.setIndex(index);
      index += 1;
      literal.push(node);
    }
  }
  return literal;
}

/*
Nodes.prototype.computeCollapsible = function() {
  for (var host in this.hosts) {
    var arr = this.hosts[host]['times'];
    for (var i = 0; i < arr.length; i++) {
      this.get(host, arr[i]).assignCollapsible(this);
    }
  }
}*/

Nodes.prototype.get = function(hostId, time) {
  var node = this.hosts[hostId][time];
  if (node === undefined) {
    return null;
  }
  return node;
}

Nodes.prototype.getNext = function(hostId, startTime) {
  var candidate = this.get(hostId, startTime);

  if (candidate == null) {
    var arr = this.hosts[hostId]['times'];
    if (!this.hosts[hostId]['sorted']) {
      this.hosts[hostId]['sorted'] = true;
      arr.sort();
    }
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > startTime) {
        return this.get(hostId, arr[i]);
      }
    }
  }
  return candidate;
}

Nodes.prototype.add = function(node) {
  var hostId = node.getHostId();
  var time = node.getTime();
  if (!this.hosts.hasOwnProperty(hostId)) {
    this.hosts[hostId] = {};
    this.hosts[hostId]['times'] = [];
  }
  this.hosts[hostId][time] = node;
  this.hosts[hostId]['times'].push(time);
  this.hosts[hostId]['sorted'] = false;
}

Nodes.prototype.getSortedHosts = function () {
  /* var hostCopy = this.hosts;
  return this.getHosts().sort(function(a, b) {
    return hostCopy[b]['times'].length - hostCopy[a]['times'].length;
  });*/
  return this.getHosts();
}

Nodes.prototype.getHosts = function() {
  return Object.keys(this.hosts);
}
