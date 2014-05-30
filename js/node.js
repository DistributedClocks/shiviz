/**
 * A Node represents an event in the model and contains references to the
 * corresponding log event, its parents and children, as well as the previous
 * and next adjacent nodes. A Graph is made up of Nodes.
 * 
 * Definitions of specific terms:
 * 
 * parent: x is a parent of y if and only if:
 * <ul>
 * <li>x happens before y and</li>
 * <li>their hosts are not the same and</li>
 * <li>there does not exist any node with x's host that happens after x and
 * before y</li>
 * </ul>
 * 
 * child: x is a child of y if and only if:
 * <ul>
 * <li>x happens after y and</li>
 * <li>their hosts are not the same and</li>
 * <li>there does not exist any node with x's host that happens before x and
 * after y</li>
 * </ul>
 * 
 * next node: x is the next node of y if and only if:
 * <ul>
 * <li>x happens after y and</li>
 * <li>their hosts are the same and</li>
 * <li>there does not exist any node that has the same host that happens before
 * x and after y</li>
 * </ul>
 * 
 * prev/previous node: x is the previous node of y is and only if:
 * <ul>
 * <li>x happens before y and</li>
 * <li>their hosts are the same and</li>
 * <li>there does not exist and node that has the same host that happens after
 * x and before y</li>
 * </ul>
 * 
 * "happens before" and "happens after": A node x happens before y if and only
 * if x preceeds y in time. When the nodes are first generated in the graph,
 * this temporal relation is based on the nodes' LogEvents' vector clocks, but
 * this may change as graph transformations are applied
 * 
 * <pre>
 * Pictorially:
 * |  |  |     -- C is a parent of X
 * A  C  E     -- X is a child of C
 * | /|  |     -- A is the previous node of X. A is NOT a parent of X
 * |/ |  |     -- B is the next node of X. B is NOT the child of X
 * X  D  F     -- C is NOT a parent of G nor is G a child of C
 * |  |\ |
 * |  | \|
 * B  |  G
 * |  |  |
 * </pre>
 * 
 * The node class makes the following guarantees:
 * <ul>
 * <li>node.getID() is globally unique</li>
 * <li>if node.getNext() != false, then node == node.getNext().getPrev()</li>
 * <li>if node.getPrev() != false, then node == node.getPrev().getNext()</li>
 * <li>if and only if x is a child of y, then y is a parent of x</li>
 * <li>All the children of a node belong to different hosts</li>
 * <li>All the parents of a node belong to different hosts</li>
 * </ul>
 */

/**
 * @constructor
 * @param {[LogEvent]} logEvents an array of corresponding log events
 * @param {String} host the host of the node
 */
function Node(logEvents, host) {
  /*
   * IMPORTANT: If you ever decide to add or remove a field, make sure the
   * clone() function is updated accordingly
   */

  /** @private */
  this.id = Node.number++;

  /** @protected */
  this.prev = null;

  /** @protected */
  this.next = null;

  /** @private */
  this.hostToChild = {};

  /** @private */
  this.hostToParent = {};

  /** @private */
  this.logEvents = logEvents;

  /** @private */
  this.host = host;

  /** @private */
  this.isHeadInner = false;

  /** @private */
  this.isTailInner = false;
}

// Global counter used to assign each node a unique ID
Node.number = 0;

/**
 * Gets the globally unique ID of the node
 * 
 * @return {Number} the ID
 */
Node.prototype.getId = function() {
  return this.id;
};

/**
 * Gets the log events associated with the node
 * 
 * This function makes no guarantees about the ordering of LogEvents in the
 * array returned. Also note that a new array is created to prevent modification
 * of the underlying private data structure, so this function takes linear
 * rather than constant time on the number of LogEvents.
 * 
 * @return {[LogEvent]} an array of associated log events
 */
Node.prototype.getLogEvents = function() {
  return this.logEvents.slice();
};

/**
 * Gets the node's host
 * 
 * @return {String} the name of the host
 */
Node.prototype.getHost = function() {
  return this.host;
};

/**
 * Determines whether the node is a dummy head node
 * 
 * @return {Boolean} True if node is head
 */
Node.prototype.isHead = function() {
  return this.isHeadInner;
};

/**
 * Determines whether the node is a dummy tail node
 * 
 * @return {Boolean} True if node is tail
 */
Node.prototype.isTail = function() {
  return this.isTailInner;
};

/**
 * Creates a shallow copy of the the node. All fields of the copy will have the
 * same value as the original node, EXCEPT the globally unique id and fields
 * regarding node connectivity (i.e parent, child, next, prev), which are
 * initialized to null.
 * 
 * @return {Node} The copy
 */
Node.prototype.clone = function() {
  var newNode = new Node(this.logEvents, this.host);
  newNode.isHeadInner = this.isHeadInner;
  newNode.isTailInner = this.isTailInner;
  return newNode;
};

/**
 * Gets the next node. The next node is the node having the same host as the
 * current one that comes directly after the current node.
 * 
 * @return {Node} the next node or null if there is no next node.
 */
Node.prototype.getNext = function() {
  return this.next;
};

/**
 * Gets the previous node. The previous node is the node having the same host as
 * the current one that comes directly before the current node.
 * 
 * @return {Node} the previous node or null if there is no previous node
 */
Node.prototype.getPrev = function() {
  return this.prev;
};

/**
 * Returns the nodes this one is connected to as an array. In the context of
 * this function, a node is said to be connected to this one if it's a parent or
 * a child.
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of connections.
 * 
 * @see getParents
 * @see getChildren
 * @see getConnections
 * 
 * @return {[Node]} an array of connected nodes
 */
Node.prototype.getConnections = function() {
  return this.getParents().concat(this.getChildren());
};

/**
 * Returns the nodes this one is connected to as an array. In the context of
 * this function, a node is said to be connected to this one if it's the
 * previous node, the next node, a parent, or a child
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of connections.
 * 
 * @see getPrev
 * @see getNext
 * @see getParents
 * @see getChildren
 * @see getConnections
 * 
 * @return {[Node]} an array of connected nodes
 */
Node.prototype.getAllConnections = function() {
  return [ this.prev, this.next ].concat(this.getParents()).concat(
      this.getChildren());
};

/**
 * Inserts a node after this one, preserving the invariants described at the top
 * of this document. The node is first removed from its previous location (i.e
 * by calling node.remove). You cannot insert a node after a tail node.
 * 
 * @param {Node} node The node to insert
 */
Node.prototype.insertNext = function(node) {
  if (this.next == node) {
    return;
  }

  if (this.isTail()) {
    throw "You cannot insert a node after a tail node";
  }

  node.remove();
  node.prev = this;
  node.next = this.next;
  node.prev.next = node;
  node.next.prev = node;
};

/**
 * Inserts a node before this one, preserving the invariants described at the
 * top of this document. The node is first removed from its previous location
 * (i.e by calling node.remove). You cannot insert a node before a head node.
 * 
 * @param {Node} node The node to insert
 */
Node.prototype.insertPrev = function(node) {
  if (this.prev == node) {
    return;
  }

  if (this.isHead()) {
    throw "You cannot insert a node before a head node";
  }

  node.remove();
  node.next = this;
  node.prev = this.prev;
  node.next.prev = node;
  node.prev.next = node;
};

/**
 * Removes a node, preserving the invariants described at the top of this
 * document. Head and tail nodes cannot be removed. This function does nothing
 * if it is called on a node that had already been removed.
 * 
 * Because this method essentially removes all links to and from the node, be
 * careful when using this inside a loop. For example, consider the following
 * code:
 * 
 * <pre>
 * var node = this.getHead(host).getNext();
 * while (!curr.isTail()) {
 *   curr.remove();
 *   curr = curr.getNext(); // sets curr to null! curr.getNext() == null after removal
 * }
 * </pre>
 */
Node.prototype.remove = function() {
  if (this.isHead() || this.isTail()) {
    throw "Head and tail nodes cannot be removed";
  }

  // nodes that have already been removed will have this.prev == null and
  // this.next == null
  if (!this.prev || !this.next) {
    return;
  }

  this.prev.next = this.next;
  this.next.prev = this.prev;
  this.prev = null;
  this.next = null;

  for ( var host in this.hostToParent) {
    var otherNode = this.hostToParent[host];
    delete otherNode.hostToChild[this.host];
  }

  for ( var host in this.hostToChild) {
    var otherNode = this.hostToChild[host];
    delete otherNode.hostToParent[this.host];
  }

  this.hostToChild = {};
  this.hostToParent = {};
};

/**
 * Determines whether the node has children.
 * 
 * @return {Boolean} True if the node has children
 */
Node.prototype.hasChildren = function() {
  for (key in this.hostToChild) {
    return true;
  }
  return false;
};

/**
 * Determines whether the node has parents
 * 
 * @return {Boolean} True if the node has parents
 */
Node.prototype.hasParents = function() {
  for (key in this.hostToParent) {
    return true;
  }
  return false;
};

/**
 * Returns parents of this node as an array
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of connections.
 * 
 * @return {[Node]} Array of parent nodes.
 */
Node.prototype.getParents = function() {
  var result = [];
  for ( var key in this.hostToParent) {
    result.push(this.hostToParent[key]);
  }
  return result;
};

/**
 * Returns children of this node as an array
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of connections.
 * 
 * @return {[Node]} Array of child nodes.
 */
Node.prototype.getChildren = function() {
  var result = [];
  for ( var key in this.hostToChild) {
    result.push(this.hostToChild[key]);
  }
  return result;
};

/**
 * Returns the parent of this node that belongs to a specific host.
 * 
 * @param {String} host The target host
 * @return {Node} The parent node or null if no parent belongs to host.
 */
Node.prototype.getParentByHost = function(host) {
  var result = this.hostToParent[host];
  return !result ? null : result;
};

/**
 * Returns the child of this node that belongs to a specific host.
 * 
 * @param {String} host The target host
 * @return {Node} The child node or null if no child belongs to host.
 */
Node.prototype.getChildByHost = function(host) {
  var result = this.hostToChild[host];
  return !result ? null : result;
};

/**
 * Removes the child of this node that belongs to a specific host. If there is
 * no child that belongs to host, then this method does nothing.
 * 
 * @param {String} host
 */
Node.prototype.removeChildByHost = function(host) {
  var node = this.getChildByHost(host);
  if (node != null) {
    this.removeChild(node);
  }
};

/**
 * Removes the parent of this node that belongs to a specific host. If there is
 * no parent that belongs to host, then this method does nothing.
 * 
 * @param {String} host
 */
Node.prototype.removeParentByHost = function(host) {
  var node = this.getParentByHost(host);
  if (node != null) {
    this.removeParent(node);
  }
};

/**
 * Adds a child to this node, preserving the invariants described at the top of
 * this document. Specifically:
 * <li>if and only if x is a child of y, then y is a parent of x</li>
 * <li>All the children of a node belong to different hosts</li>
 * <li>All the parents of a node belong to different hosts</li>
 * 
 * The last two invariants are preserved by calling removeChild or removeParent
 * on any existing children or parents that violate the invariants.
 * 
 * A node x cannot be the child of a node y if they have the same host.
 * 
 * @param {Node} node The child node to add
 */
Node.prototype.addChild = function(node) {
  if (node.host == this.host) {
    throw "A node cannot be the child of another node who has the same host";
  }

  if (this.getChildByHost(node.host) == node) {
    return;
  }

  this.removeChildByHost(node.host);
  this.hostToChild[node.host] = node;

  node.removeParentByHost(this.host);
  node.hostToParent[this.host] = this;
};

/**
 * Adds a parent to this node, preserving the invariants described at the top of
 * this document. Specifically:
 * <li>if and only if x is a child of y, then y is a parent of x</li>
 * <li>All the children of a node belong to different hosts</li>
 * <li>All the parents of a node belong to different hosts</li>
 * 
 * The last two invariants are preserved by calling removeChild or removeParent
 * on any existing children or parents that violate the invariants.
 * 
 * A node x cannot be the parent of a node y if they have the same host.
 * 
 * @param {Node} node The node to add as a parent to this
 */
Node.prototype.addParent = function(node) {
  if (node.host == this.host) {
    throw "A node cannot be the parent of another node who has the same host";
  }

  if (this.getParentByHost(node.host) == node) {
    return;
  }

  this.removeParentByHost(node.host);
  this.hostToParent[node.host] = node;

  node.removeChildByHost(this.host);
  node.hostToChild[this.host] = this;
};

/**
 * Removes the target node from this's children, preserving the invariants
 * described at the top of this document.
 * 
 * @param node
 */
Node.prototype.removeChild = function(node) {
  if (this.hostToChild[node.host] != node) {
    return;
  }

  delete this.hostToChild[node.host];
  delete node.hostToParent[this.host];
};

/**
 * Removes the target node from this's parents, preserving the invariants
 * described at the top of this document.
 * 
 * @param node
 */
Node.prototype.removeParent = function(node) {
  if (this.hostToParent[node.host] != node) {
    return;
  }

  delete this.hostToParent[node.host];
  delete node.hostToChild[this.host];
};
