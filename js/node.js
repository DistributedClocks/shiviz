/**
 * A Node represents an event in the model and contains
 * references to the corresponding log event, its parents
 * and children, as well as the previous and next adjacent
 * nodes
 * @param {[LogEvent]} logEvents an array of corresponding
 *                               log events
 * @param {String}     host      the host of the node
 */
function Node(logEvents, host) {
  /*
   * Below are the fields of the Node class. They should
   * not be modified directly; you should interact with the
   * node class only through its methods.
   * 
   * IMPORTANT: If you ever decide to add or remove a field,
   * make sure the clone() function is updated accordingly
   */
  this.id = Node.number++;
  this.prev = null;
  this.next = null;
  this.children = {};
  this.parents = {};
  this.hostToChild = {};
  this.hostToParent = {};
  
  this.logEvents = logEvents;
  this.host = host;
  
  // isHeadInner and isTailInner store whether the node is
  // a dummy head or tail node
  this.isHeadInner = false;
  this.isTailInner = false;
}

// Global counter used to assign each node a unique ID
Node.number = 0;

/**
 * Clones the node
 * @return {Node} a shallow copy of the node. All fields of the copy
 * will have the same value as the original node, EXCEPT the id field,
 * which is guaranteed to be globally unique.
 */
Node.prototype.clone = function() {
  var newNode = new Node(this.logEvents, this.host);
  newNode.prev = this.prev;
  newNode.next = this.next;
//  newNode.children = this.children;
//  newNode.parents = this.parents;
  newNode.hostToChild = this.hostToChild;
  newNode.hostToParent = this.hostToParent;
  newNode.isHeadInner = this.isHeadInner;
  newNode.isTailInner = this.isTailInner;
  return newNode;
};

/**
 * Gets the nodes this one is connected to. A node is said to be 
 * connected to this one if it's the previous node, the next node,
 * or 
 * @return {[Node]} an array of connected nodes (adjacent
 * nodes, parent nodes, child nodes)
 */
Node.prototype.getAllConnections = function() {
  return [this.prev, this.next].concat(this.getParents()).concat(this.getChildren());
};

/**
 * Determines whether the node is a dummy head node
 * @return {Boolean} whether the node is a head
 */
Node.prototype.isHead = function() {
  return this.isHeadInner;
};

/**
 * Determines whether the node is a dummy tail node
 * @return {Boolean} whether the node is a tail
 */
Node.prototype.isTail = function() {
  return this.isTailInner;
};

/**
 * Gets the unique ID of the node
 * @return {Number} the ID
 */
Node.prototype.getId = function() {
  return this.id;
};

/**
 * Gets the next node. The next node is the node having the
 * same host as the current one that comes directly after the 
 * current node. Returns null if there is no next node.
 * @return {Node} the next node
 */
Node.prototype.getNext = function() {
  return this.next;
};


/**
 * Gets the previous node. The previous node is the node
 * having the same host as the current one that comes directly
 * before the current node. Returns null if there is no previous node
 * @return {Node} the previous node
 */
Node.prototype.getPrev = function() {
  return this.prev;
};

/**
 * connections same
 */
Node.prototype.insertNext = function(node) {
  if(!node || this.isTail() || this.next == node) { //check
    return;
  }
  node.remove();
  node.prev = this;
  node.next = this.next;
  node.prev.next = node;
  node.next.prev = node;
};

/**
 * 
 */
Node.prototype.insertPrev = function(node) {
  if(!node || this.isHead() || this.prev == node) {
    return;
  }
  node.remove();
  node.next = this;
  node.prev = this.prev;
  node.next.prev = node;
  node.prev.next = node;
};

/**
 * 
 */
Node.prototype.remove = function() {
  if(this.isHead() || this.isTail() || !this.prev || !this.next) {
    return;
  }
  
  this.prev.next = this.next;
  this.next.prev = this.prev;
  this.prev = null;
  this.next = null;
  
  for(var host in this.hostToParent) {
    var otherNode = this.hostToParent[host];
    delete otherNode.hostToChild[this.host];
  }
  
  for(var host in this.hostToChild) {
    var otherNode = this.hostToChild[host];
    delete otherNode.hostToParent[this.host];
  }

  this.hostToChild = {};
  this.hostToParent = {};
  
};

/**
 * Determines whether the node has children. 
 * @return {Boolean} whether the node has children
 */
Node.prototype.hasChildren = function() {
  for(key in this.hostToChild) {
    return true;
  }
  return false;
};

/**
 * Determines whether the node has parents
 * @return {Boolean} whether the node has parents
 */
Node.prototype.hasParents = function() {
  for(key in this.hostToParent) {
    return true;
  }
  return false;
};

/**
 * 
 */
Node.prototype.getParents = function() {
  var result = [];
  for(var key in this.hostToParent) {
    result.push(this.hostToParent[key]);
  }
  return result;
};

/**
 * 
 */
Node.prototype.getChildren = function() {
  var result = [];
  for(var key in this.hostToChild) {
    result.push(this.hostToChild[key]);
  }
  return result;
};

/**
 * Gets the connections of the node
 * @return {[Node]} the node's children
 */
Node.prototype.getConnections = function() {
  return this.getParents().concat(this.getChildren());
};

/**
 * 
 */
Node.prototype.addChild = function(node) {
  if(this.hostToChild[node.host] == node) {
    return;
  }
  
  if(this.hostToChild[node.host] != undefined) {
    oldChild = this.hostToChild[node.host];
    delete oldChild.hostToParent[this.host];
  }
  this.hostToChild[node.host] = node;
  
  if(node.hostToParent[this.host] != undefined) {
    oldParent = node.hostToParent[this.host];
    delete oldParent.hostToChild[node.host];
  }
  node.hostToParent[this.host] = this;
};

/**
 * 
 */
Node.prototype.addParent = function(node) {
//todo
};

/**
 * 
 */
Node.prototype.removeChild = function(node) {
  if(this.hostToChild[node.host] != node) {
    return;
  }
  
  delete this.hostToChild[node.host];
  delete node.hostToParent[this.host];
};


/**
 * 
 */
Node.prototype.removeParent = function(node) {
  if(this.hostToParent[node.host] != node) {
    return;
  }
  delete this.parents[node.id];
  delete node.children[this.id];
  
  delete this.hostToParent[node.host];
  delete node.hostToChild[this.host];
};


/**
 * Gets the log events associated with the node
 * @return {[LogEvent]} an array of associated log events
 */
Node.prototype.getLogEvents = function() {
  return this.logEvents;
};

/**
 * Gets the node's host
 * @return {String} the name of the host
 */
Node.prototype.getHost = function() {
  return this.host;
};