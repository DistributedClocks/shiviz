function Node(logEvents, host) {
  this.id = Node.number++;
  this.prev = null;
  this.next = null;
  this.afterNode = null;
  this.beforeNode = null;
  
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
  newNode.afterNode = this.afterNode;
  newNode.beforeNode = this.beforeNode;
  newNode.isHeadInner = this.isHeadInner;
  newNode.isTailInner = this.isTailInner;
  return newNode;
};

Node.prototype.getConnections = function() {
  return [this.prev, this.next, this.afterNode, this.beforeNode];
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

Node.prototype.hasAfterNode = function() {
  return this.afterNode != null;
};

Node.prototype.hasBeforeNode = function() {
  return this.beforeNode != null;
};

//change to auto set link. Also for set and get prev
Node.prototype.getAfterNode = function() {
  return this.afterNode;
};

Node.prototype.getBeforeNode = function() {
  return this.beforeNode;
};

Node.prototype.setAfterNode = function(node) {
  this.afterNode = node;
};

Node.prototype.setBeforeNode = function(node) {
  this.beforeNode = node;
};


Node.prototype.getLogEvents = function() {
  return this.logEvents;
};

Node.prototype.getHost = function() {
  return this.host;
};
