function Node(logEvents, host) {
  this.id = Node.number++;
  this.prev = null;
  this.next = null;
  this.children = [];
  this.parents = [];
  
  this.logEvents = logEvents;
  this.host = host;
  
  this.isHeadInner = false;
  this.isTailInner = false;
}

Node.number = 0;

Node.prototype.clone = function() {
  var newNode = new Node(this.logEvents, this.host);
  newNode.prev = this.prev;
  newNode.next = this.next;
  newNode.children = [];
  newNode.parents = [];
  newNode.isHeadInner = this.isHeadInner;
  newNode.isTailInner = this.isTailInner;
  return newNode;
};

Node.prototype.getConnections = function() {
  return [this.prev, this.next, this.children, this.parents];
};

Node.prototype.isHead = function() {
  return this.isHeadInner;
};

Node.prototype.isTail = function() {
  return this.isTailInner;
};

Node.prototype.getId = function() {
  return this.id;
};

Node.prototype.getNext = function() {
  return this.next;
};

Node.prototype.getPrev = function() {
  return this.prev;
};

Node.prototype.hasChildren = function() {
  return this.children.length > 0;
};

Node.prototype.hasParents = function() {
  return this.parents.lenght > 0;
};

//change to auto set link. Also for set and get prev
Node.prototype.getChildren = function() {
  return this.children;
};

Node.prototype.getParents = function() {
  return this.parents;
};

Node.prototype.addChild = function(node) {
  var earliest = true;
  var sameHost = this.children.filter(function (n) {
    return n.host == node.host;
  });

  for (var i in sameHost) {
    var n = sameHost[i];
    if (n.logEvents[0].time > node.logEvents[0].time) {
      n.removeParent(this);
      this.removeChild(n);
    } else {
      earliest = false;
    }
  }

  if (earliest) {
    this.children.push(node);
    node.addParent(this);
  }
};

Node.prototype.addParent = function(node) {
  var latest = true;
  var sameHost = this.parents.filter(function (n) {
    return n.host == node.host;
  });

  for (var i in sameHost) {
    var n = sameHost[i];
    if (n.logEvents[0].time < node.logEvents[0].time) {
      n.removeChild(this);
      this.removeParent(n);
    } else {
      latest = false;
    }
  }
  
  if (latest) {
    this.parents.push(node);
    node.addChild(this);
  }
};

Node.prototype.removeChild = function (node) {
  this.children.splice(this.children.indexOf(node), 1);
}

Node.prototype.removeParent = function (node) {
  this.parents.splice(this.parents.indexOf(node), 1);
}

Node.prototype.getLogEvents = function() {
  return this.logEvents;
};

Node.prototype.getHost = function() {
  return this.host;
};
