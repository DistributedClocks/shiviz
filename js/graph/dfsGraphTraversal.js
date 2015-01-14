/**
 * Constructs a DFSGraphTraversal
 * 
 * @classdesc
 * 
 * A DFSGraphTraversal specifies a strategy for traversing an
 * {@link AbstractGraph} in depth-first-search order. As is typical with
 * depth-first-search, nodes to be visited (along with their state and data) are
 * stored on a stack.
 * 
 * @constructor
 */
function DFSGraphTraversal() {
    GraphTraversal.call(this);

    /** @private */
    this.stack = [];

    /** @private */
    this.parent = {};

    this.reset();
}

// DFSGraphTraversal extends GraphTraversal
DFSGraphTraversal.prototype = Object.create(GraphTraversal.prototype);
DFSGraphTraversal.prototype.constructor = DFSGraphTraversal;

/**
 * Overrides {@link GraphTraversal#reset}
 */
DFSGraphTraversal.prototype.reset = function() {
    GraphTraversal.prototype.reset.call(this);

    this.stack = [];
};

/**
 * Adds a node to the stack. When the node is visited, the current state and
 * data object will be set to the ones provided
 * 
 * @param {AbstractNode} node The node to add to the stack
 * @param {String} state The state to add to the stack
 * @param {*} data The data to add to the stack
 */
DFSGraphTraversal.prototype.addNode = function(node, state, data) {
    this.stack.push({
        node: node,
        state: state,
        data: data
    });

    this.parent[node.getId()] = this.currentNode;
};

/**
 * Adds all nodes to the stack. All nodes added will share the same state and
 * data provided
 * 
 * @param {Array<AbstractNode>} nodes
 * @param {String} state
 * @param {Object} data
 */
DFSGraphTraversal.prototype.addAllNodes = function(nodes, state, data) {
    for (var i = 0; i < nodes.length; i++) {
        this.addNode(nodes[i], state, data);
    }
};

/**
 * Overrides {@link GraphTraversal#hasEnded}
 */
DFSGraphTraversal.prototype.hasEnded = function() {
    return this.stack.length == 0 || GraphTraversal.prototype.hasEnded.call(this);
};

/**
 * Overrides {@link GraphTraversal#stepInner}
 */
DFSGraphTraversal.prototype.stepInner = function() {

    var curr = this.stack.pop();
    
    this.currentNode = curr.node;
    this.state = curr.state;
    this.currentData = curr.data;

    return GraphTraversal.prototype.stepInner.call(this);
};

/**
 * Gets the "trail" of nodes, starting at the one provided. The trail is list of
 * nodes that were visited in order to get the the parameter.
 * 
 * @param {AbstractNode} node
 * @returns {Array<AbstractNode>}
 */
GraphTraversal.prototype.getTrail = function(node) {
    if (!node) {
        node = this.currentNode;
    }

    var trail = [];
    while (node != null) {
        trail.push(node);
        node = this.parent[node.getId()];
    }
    return trail;
};