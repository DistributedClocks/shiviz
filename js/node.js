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
  this.id = Node.number++;
  this.prev = null;
  this.next = null;
  this.children = [];
  this.parents = [];
  
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
 * @return {Node} a copy of the current node. Does not
 *                contain proper references to adjacent
 *                nodes or parents/children
 */
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

/**
 * Gets the connected nodes
 * @return {[Node]} an array of connected nodes (adjacent
 * nodes, parent nodes, child nodes)
 */
Node.prototype.getConnections = function() {
  return [this.prev, this.next].concat(this.children).concat(this.parents);
};

/**
 * Determines whether the node is a head node
 * @return {Boolean} whether the node is a head
 */
Node.prototype.isHead = function() {
  return this.isHeadInner;
};

/**
 * Determines whether the node is a tail node
 * @return {Boolean} whether the node is a tail
 */
Node.prototype.isTail = function() {
  return this.isTailInner;
};

/**
 * Gets the ID of the node
 * @return {Number} the ID
 */
Node.prototype.getId = function() {
  return this.id;
};

/**
 * Gets the next adjacent node
 * @return {Node} the next node
 */
Node.prototype.getNext = function() {
  return this.next;
};

/**
 * Gets the previous adjacent node
 * @return {Node} the previous node
 */
Node.prototype.getPrev = function() {
  return this.prev;
};

/**
 * Determines whether the node has children
 * @return {Boolean} whether the node has children
 */
Node.prototype.hasChildren = function() {
  return this.children.length > 0;
};

/**
 * Determines whether the node has parents
 * @return {Boolean} whether the node has parents
 */
Node.prototype.hasParents = function() {
  return this.parents.lenght > 0;
};

// TODO: change to auto set link. Also for set and get prev
/**
 * Gets the children of the node
 * @return {[Node]} the node's children
 */
Node.prototype.getChildren = function() {
  return this.children;
};

/**
 * Gets the parents of the node
 * @return {[Node]} the node's parents
 */
Node.prototype.getParents = function() {
  return this.parents;
};

/**
 * Adds a child to the node.
 * This also adds the corresponding parent link from the
 * child to the current node.
 * Removes later children in the same host that would be
 * implicit, and does not add the child if there is an
 * earlier one in the same host
 * @param {Node} node the node to add as a child
 */
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

/**
 * Adds a parent to the node.
 * Also adds corresponding child link to parent node.
 * Removes implicit connections (see addChild description)
 * @param {Node} node the node to add as parent
 */
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

/**
 * Removes a child from the node
 * @param  {Node} node the node to remove
 */
Node.prototype.removeChild = function (node) {
  this.children.splice(this.children.indexOf(node), 1);
}

/**
 * Removes a parent from the node
 * @param  {Node} node the node to remove
 */
Node.prototype.removeParent = function (node) {
  this.parents.splice(this.parents.indexOf(node), 1);
}

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