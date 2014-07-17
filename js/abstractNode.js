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
 * family: x is a family node of y if y is x's parent or child. This implies
 * that x is a family node of y if and only if y is a family node of x
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
 * between: A node n is between nodes x and y if n happens after x and before y
 * OR n happens after y and before x. In addition, nodes x, y, and n must all
 * belong to the same host
 * 
 * consecutive: a sequence S of nodes n_1, n_2 ... n_k are consecutive if n_i is
 * the previous node of n_(i+1) for all i between 1 and k-1 inclusive
 * 
 * "happens before" and "happens after": There is a notion of ordering between
 * nodes. More formally, there is a comparison function f(n1, n2) that indicates
 * the ordering of two nodes n1 and n2. For a pair of nodes with the same host,
 * n1 must either happen before (be ordered before) n2 or happens after (be
 * ordered after) n1. If a pair of nodes have different hosts, it could also be
 * the case that neither node happens before or after the other. A node x
 * happens after node y if and only if node y happens before node x. This notion
 * of ordering - this comparison function - may be different for each concrete
 * class that extends node, and it is up to subclasses to precisely define their
 * comparison function, subject to the restrictions above.
 * 
 * <pre>
 * Pictorially:
 * |  |  |     -- C is a parent of X
 * A  C  E     -- X is a child of C
 * | /|  |     -- A is the previous node of X. A is NOT a parent of X
 * |/ |  |     -- B is the next node of X. B is NOT the child of X
 * X  D  F     -- C is NOT a parent of G nor is G a child of C
 * |  |\ |     -- A X B are consecutive nodes
 * |  | \|     -- X is between A and B
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
 * <li>Head and tail nodes have no family</li>
 * </ul>
 */

/**
 * @constructor
 * @param {Array<LogEvent>} logEvent The LogEvents that this node represents
 */
function AbstractNode() {

    if (this.constructor == AbstractNode) {
        throw new Exception("Cannot instantiate AbstractNode; AbstractNode is an abstract class");
    }

    /** @private */
    this.id = AbstractNode.number++;

    /** @protected */
    this.prev = null;

    /** @protected */
    this.next = null;

    /** @private */
    this.hostToChild = {};

    /** @private */
    this.hostToParent = {};

    /** @private */
    this.host = null;

    /** @private */
    this.isHeadInner = false;

    /** @private */
    this.isTailInner = false;

    /** @private */
    this.graph = null;

}

// Global counter used to assign each node a unique ID
AbstractNode.number = 0;

/**
 * Gets the globally unique ID of the node
 * 
 * @return {Number} the ID
 */
AbstractNode.prototype.getId = function() {
    return this.id;
};

/**
 * Gets the node's host
 * 
 * @return {String} the name of the host
 */
AbstractNode.prototype.getHost = function() {
    return this.host;
};

/**
 * Determines whether the node is a dummy head node
 * 
 * @return {Boolean} True if node is head
 */
AbstractNode.prototype.isHead = function() {
    return this.isHeadInner;
};

/**
 * Determines whether the node is a dummy tail node
 * 
 * @return {Boolean} True if node is tail
 */
AbstractNode.prototype.isTail = function() {
    return this.isTailInner;
};

/**
 * Gets the next node. The next node is the node having the same host as the
 * current one that comes directly after the current node.
 * 
 * @return {AbstractNode} the next node or null if there is no next node.
 */
AbstractNode.prototype.getNext = function() {
    return this.next;
};

/**
 * Gets the previous node. The previous node is the node having the same host as
 * the current one that comes directly before the current node.
 * 
 * @return {AbstractNode} the previous node or null if there is no previous node
 */
AbstractNode.prototype.getPrev = function() {
    return this.prev;
};

/**
 * Returns the family nodes of this node as an array.
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of family nodes.
 * 
 * @see getParents
 * @see getChildren
 * 
 * @return {Array<AbstractNode>} an array of connected nodes
 */
AbstractNode.prototype.getFamily = function() {
    return this.getParents().concat(this.getChildren());
};

/**
 * Returns the nodes this one is connected to as an array. In the context of
 * this function, a node is said to be connected to this one if it's the
 * previous node, the next node, a parent, or a child. Note that if prev or next
 * is a head or tail or null, it will still be returned.
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
 * @see getFamily
 * 
 * @return {Array<AbstractNode>} an array of connected nodes
 */
AbstractNode.prototype.getConnections = function() {
    return [ this.prev, this.next ].concat(this.getFamily());
};

/**
 * Inserts a node after this one, preserving the invariants described at the top
 * of this document. The node is first removed from its previous location (i.e
 * by calling node.remove). You cannot insert a node after a tail node.
 * 
 * @param {AbstractNode} node The node to insert
 */
AbstractNode.prototype.insertNext = function(node) {
    if (this.next == node) {
        return;
    }

    if (this.isTail()) {
        throw new Exception("AbstractNode.prototype.insertNext: You cannot insert a node after a tail node");
    }

    node.remove();
    node.prev = this;
    node.next = this.next;
    node.prev.next = node;
    node.next.prev = node;

    node.graph = this.graph;
    node.host = this.host;

    this.notifyGraph(new AddNodeEvent(node, node.prev, node.next));
};

/**
 * Inserts a node before this one, preserving the invariants described at the
 * top of this document. The node is first removed from its previous location
 * (i.e by calling node.remove). You cannot insert a node before a head node.
 * 
 * @param {AbstractNode} node The node to insert
 */
AbstractNode.prototype.insertPrev = function(node) {
    if (this.prev == node) {
        return;
    }

    if (this.isHead()) {
        throw new Exception("AbstractNode.prototype.insertPrev: You cannot insert a node before a head node");
    }

    node.remove();
    node.next = this;
    node.prev = this.prev;
    node.next.prev = node;
    node.prev.next = node;

    node.graph = this.graph;
    node.host = this.host;

    this.notifyGraph(new AddNodeEvent(node, node.prev, node.next));
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
 *     curr.remove();
 *     curr = curr.getNext(); // sets curr to null! curr.getNext() == null after removal
 * }
 * </pre>
 */
AbstractNode.prototype.remove = function() {
    if (this.isHead() || this.isTail()) {
        throw new Exception("AbstractNode.prototype.remove: Head and tail nodes cannot be removed");
    }

    // nodes that have already been removed will have this.prev == null and
    // this.next == null
    if (!this.prev || !this.next) {
        return;
    }

    var prev = this.prev;
    var next = this.next;

    prev.next = next;
    next.prev = prev;
    this.prev = null;
    this.next = null;

    for ( var host in this.hostToParent) {
        var otherNode = this.hostToParent[host];
        delete otherNode.hostToChild[this.host];
        this.notifyGraph(new RemoveFamilyEvent(otherNode, this));
    }

    for ( var host in this.hostToChild) {
        var otherNode = this.hostToChild[host];
        delete otherNode.hostToParent[this.host];
        this.notifyGraph(new RemoveFamilyEvent(this, otherNode));
    }

    this.hostToChild = {};
    this.hostToParent = {};

    this.notifyGraph(new RemoveNodeEvent(this, prev, next));

    this.host = null;
    this.graph = null;
};

/**
 * Determines whether the node has children.
 * 
 * @return {Boolean} True if the node has children
 */
AbstractNode.prototype.hasChildren = function() {
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
AbstractNode.prototype.hasParents = function() {
    for (key in this.hostToParent) {
        return true;
    }
    return false;
};

/**
 * Determines whether the node has family
 * 
 * @return {Boolean} True if the node has family
 */
AbstractNode.prototype.hasFamily = function() {
    return this.hasChildren() || this.hasParents();
};

/**
 * Returns parents of this node as an array
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of connections.
 * 
 * @return {Array.<AbstractNode>} Array of parent nodes.
 */
AbstractNode.prototype.getParents = function() {
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
 * @return {Array<AbstractNode>} Array of child nodes.
 */
AbstractNode.prototype.getChildren = function() {
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
 * @return {AbstractNode} The parent node or null if no parent belongs to host.
 */
AbstractNode.prototype.getParentByHost = function(host) {
    var result = this.hostToParent[host];
    return !result ? null : result;
};

/**
 * Returns the child of this node that belongs to a specific host.
 * 
 * @param {String} host The target host
 * @return {AbstractNode} The child node or null if no child belongs to host.
 */
AbstractNode.prototype.getChildByHost = function(host) {
    var result = this.hostToChild[host];
    return !result ? null : result;
};

/**
 * Removes the child of this node that belongs to a specific host. If there is
 * no child that belongs to host, then this method does nothing.
 * 
 * @param {String} host
 */
AbstractNode.prototype.removeChildByHost = function(host) {
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
AbstractNode.prototype.removeParentByHost = function(host) {
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
 * @param {AbstractNode} node The child node to add
 */
AbstractNode.prototype.addChild = function(node) {
    if (node.isHead() || node.isTail()) {
        throw new Exception("AbstractNode.prototype.addChild: Cannot add child to head or tail node");
    }

    if (node.host == this.host) {
        throw new Exception("AbstractNode.prototype.addChild: A node cannot be the child of another node who has the same host");
    }

    if (this.getChildByHost(node.host) == node) {
        return;
    }

    this.removeChildByHost(node.host);
    this.hostToChild[node.host] = node;

    node.removeParentByHost(this.host);
    node.hostToParent[this.host] = this;

    this.notifyGraph(new AddFamilyEvent(this, node));
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
 * @param {AbstractNode} node The node to add as a parent to this
 */
AbstractNode.prototype.addParent = function(node) {
    if (node.isHead() || node.isTail()) {
        throw new Exception("AbstractNode.prototype.addParent: Cannot add parent to head or tail node");
    }

    if (node.host == this.host) {
        throw new Exception("AbstractNode.prototype.addParent: A node cannot be the parent of another node who has the same host");
    }

    if (this.getParentByHost(node.host) == node) {
        return;
    }

    this.removeParentByHost(node.host);
    this.hostToParent[node.host] = node;

    node.removeChildByHost(this.host);
    node.hostToChild[this.host] = this;

    this.notifyGraph(new AddFamilyEvent(node, this));
};

/**
 * Removes the target node from this's children, preserving the invariants
 * described at the top of this document. If the argument is not one of this'
 * children, this method does nothing.
 * 
 * @param {AbstractNode} node
 */
AbstractNode.prototype.removeChild = function(node) {
    if (this.hostToChild[node.host] != node) {
        return;
    }

    delete this.hostToChild[node.host];
    delete node.hostToParent[this.host];

    this.notifyGraph(new RemoveFamilyEvent(this, node));
};

/**
 * Removes the target node from this's parents, preserving the invariants
 * described at the top of this document. If the argument is not one of this'
 * parents, this method does nothing.
 * 
 * @param {AbstractNode} node
 */
AbstractNode.prototype.removeParent = function(node) {
    if (this.hostToParent[node.host] != node) {
        return;
    }

    delete this.hostToParent[node.host];
    delete node.hostToChild[this.host];

    this.notifyGraph(new RemoveFamilyEvent(node, this));
};

/**
 * Removes the target node from this's parents or children, preserving the
 * invariants described at the top of this document. If the argument is not one
 * of this' parents or children, this method does nothing
 * 
 * @param {AbstractNode} node
 */
AbstractNode.prototype.removeFamily = function(node) {
    this.removeChild(node);
    this.removeParent(node);
};

/**
 * Removes all of this node's children while preserving the invariants described
 * at the top of this document.
 */
AbstractNode.prototype.clearChildren = function() {
    for ( var host in this.hostToChild) {
        this.removeChild(this.hostToChild[host]);
    }
};

/**
 * Removes all of this node's parents while preserving the invariants described
 * at the top of this document.
 */
AbstractNode.prototype.clearParents = function() {
    for ( var host in this.hostToParent) {
        this.removeParent(this.hostToParent[host]);
    }
};

/**
 * Removes all of this node's family while preserving the invariants described
 * at the top of this document.
 */
AbstractNode.prototype.clearFamily = function() {
    this.clearChildren();
    this.clearParents();
};

/**
 * @private
 * @param event
 */
AbstractNode.prototype.notifyGraph = function(event) {
    if (this.graph != null) {
        this.graph.notify(event);
    }
};
