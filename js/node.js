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
  this.children.push(node);
};

Node.prototype.addParent = function(node) {
  this.parents.push(node);
};

Node.prototype.getLogEvents = function() {
  return this.logEvents;
};

Node.prototype.getHost = function() {
  return this.host;
};
