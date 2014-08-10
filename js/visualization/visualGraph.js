/**
 * Constructs a VisualGraph that is the visualization of the specified graph.
 * The VisualGraph will have the layout and host permutation specified
 * 
 * @classdesc
 * 
 * A VisualGraph represents the visualization of a graph; it describes how the
 * graph is to be drawn. Note that the actual drawing logic is not part of this
 * class.
 * 
 * A VisualGraph is a composition of VisualNodes and VisualEdges. It provides
 * methods to get the corresponding VisualNode or VisualEdge from graph Nodes
 * 
 * @constructor
 * @param {Graph} graph The underlying Graph that this VisualGraph is a
 *            visualization of
 * @param {Layout} layout A layout object that is responsible for setting the
 *            positions of VisualNodes and Edges
 * @param {HostPermutation} hostPermutation
 */
function VisualGraph(graph, layout, hostPermutation) {

    /** @private */
    this.graph = graph;

    /** @private */
    this.layout = layout;

    /** @private */
    this.hostPermutation = hostPermutation;

    /** @private */
    this.nodeIdToVisualNode = {};

    /** @private */
    this.links = {}; // A mapping of edge IDs to VisualEdges

    this.graph.addObserver(AddNodeEvent, this, function(event, g) {
        g.addVisualNodeByNode(event.getNewNode());
        g.removeVisualEdgeByNodes(event.getPrev(), event.getNext());
        g.addVisualEdgeByNodes(event.getPrev(), event.getNewNode());
        if (!event.getNext().isTail()) {
            g.addVisualEdgeByNodes(event.getNewNode(), event.getNext());
        }
    });

    this.graph.addObserver(RemoveNodeEvent, this, function(event, g) {
        g.removeVisualEdgeByNodes(event.getPrev(), event.getRemovedNode());
        g.removeVisualEdgeByNodes(event.getRemovedNode(), event.getNext());
        if (!event.getNext().isTail()) {
            g.addVisualEdgeByNodes(event.getPrev(), event.getNext());
        }
        g.removeVisualNodeByNode(event.getRemovedNode());
    });

    this.graph.addObserver(AddFamilyEvent, this, function(event, g) {
        g.addVisualEdgeByNodes(event.getParent(), event.getChild());
    });

    this.graph.addObserver(RemoveFamilyEvent, this, function(event, g) {
        g.removeVisualEdgeByNodes(event.getParent(), event.getChild());
    });

    this.graph.addObserver(RemoveHostEvent, this, function(event, g) {
        delete g.nodeIdToVisualNode[event.getHead().getId()];
    });

    // Create nodes
    var nodes = this.graph.getAllNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (!node.isTail()) {
            var visualNode = new VisualNode(node);
            this.nodeIdToVisualNode[node.getId()] = visualNode;
            visualNode.setFillColor(this.hostPermutation.getHostColor(visualNode.getHost()));
        }
    }

    // Create edges
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var visualNode = this.nodeIdToVisualNode[node.getId()];

        if (node.isHead() || node.isTail()) {
            continue;
        }

        var prev = node.getPrev();
        var linkId = this.getEdgeId(node, prev);
        this.links[linkId] = new VisualEdge(this.nodeIdToVisualNode[prev.getId()], visualNode);

        var connect = node.getChildren();
        for (var j = 0; j < connect.length; j++) {
            var child = connect[j];
            var childLinkId = this.getEdgeId(node, child);
            this.links[childLinkId] = new VisualEdge(visualNode, this.nodeIdToVisualNode[child.getId()]);
        }

    }

    this.layout.start(this, this.hostPermutation);
}

/**
 * Updates the VisualGraph and its layout
 */
VisualGraph.prototype.update = function() {
    this.layout.start(this, this.hostPermutation);
};

/**
 * Returns the underlying ModelGraph that this VisualGraph is a visualization of
 * 
 * @returns {ModelGraph} the underlying graph.
 */
VisualGraph.prototype.getGraph = function() {
    return this.graph;
};

/**
 * Returns the hosts associated with this VisualGraph as an array
 * 
 * @returns {Array<String>} The array of hosts
 */
VisualGraph.prototype.getHosts = function() {
    return this.graph.getHosts();
};

/**
 * <p>
 * Returns all VisualNodes in this VisualGraph as an array.
 * </p>
 * 
 * <p>
 * There are no guarantees about the ordering of elements in the returned array.
 * Note that a new array is created to prevent access to the underlying one, so
 * this method takes linear time.
 * </p>
 * 
 * @returns {Array<VisualNode>} The array of VisualNodes
 */
VisualGraph.prototype.getVisualNodes = function() {
    var nodes = [];
    for (var id in this.nodeIdToVisualNode) {
        nodes.push(this.nodeIdToVisualNode[id]);
    }
    return nodes;
};

/**
 * <p>
 * Returns only start VisualNodes in this VisualGraph as an array. Start nodes
 * correspond to dummy head {@link ModelNode}s and may be drawn as a header
 * depending on the visualization
 * </p>
 * 
 * <p>
 * There are no guarantees about the ordering of elements in the returned array.
 * Note that a new array is created to prevent access to the underlying one, so
 * this method takes linear time.
 * </p>
 * 
 * @returns {Array<VisualNode>} The array of VisualNodes
 */
VisualGraph.prototype.getStartVisualNodes = function() {
    var nodes = [];
    for (var id in this.nodeIdToVisualNode) {
        var node = this.nodeIdToVisualNode[id];
        if (node.isStart()) {
            nodes.push(node);
        }
    }
    return nodes;
};

/**
 * <p>
 * Returns non-start VisualNodes in this VisualGraph as an array. Start nodes
 * correspond to dummy head {@link ModelNode}s and may be drawn as a header
 * depending on the visualization
 * </p>
 * 
 * <p>
 * There are no guarantees about the ordering of elements in the returned array.
 * Note that a new array is created to prevent access to the underlying one, so
 * this method takes linear time.
 * </p>
 * 
 * @returns {Array<VisualNode>} The array of VisualNodes
 */
VisualGraph.prototype.getNonStartVisualNodes = function() {
    var nodes = [];
    for (var id in this.nodeIdToVisualNode) {
        var node = this.nodeIdToVisualNode[id];
        if (!node.isStart()) {
            nodes.push(node);
        }
    }
    return nodes;
};

/**
 * <p>
 * Returns all VisualEdges in this VisualGraph as an array.
 * </p>
 * 
 * <p>
 * There are no guarantees about the ordering of elements in the returned array.
 * Note that a new array is created to prevent access to the underlying one, so
 * this method takes linear time.
 * </p>
 * 
 * @returns {Array<VisualEdge>} The array of VisualEdges.
 */
VisualGraph.prototype.getVisualEdges = function() {
    var edges = [];
    for (var id in this.links) {
        edges.push(this.links[id]);
    }
    return edges;
};

/**
 * Gets the VisualNode in this VisualGraph that is the visualization of the
 * {@link ModelNode} provided as a parameter. Returns null if no VisualNode
 * found
 * 
 * @param {ModelNode} node The node whose visualization within this graph will
 *            be returned
 * @returns {VisualNode} The VisualNode that is the visualization of node or
 *          null if none exists
 */
VisualGraph.prototype.getVisualNodeByNode = function(node) {
    var id = node.getId();
    if (!this.nodeIdToVisualNode[id]) {
        return null;
    }
    return this.nodeIdToVisualNode[id];
};

/**
 * Gets the VisualEdge in this VisualGraph that is the visualization of the edge
 * connecting node1 and node2. Note that getVisualEdgeByNodes(a, b) ==
 * getVisualEdgeByNodes(b, a)
 * 
 * @param {ModelNode} node1 One of the end nodes of the edge
 * @param {ModelNode} node2 One of the end nodes of the edge
 * @returns {VisualEdge} The VisualEdge that is the visualization of the edge
 *          between node1 and node2, or null if none exists
 */
VisualGraph.prototype.getVisualEdgeByNodes = function(node1, node2) {
    var linkId = this.getEdgeId(node1, node2);
    if (!this.links[linkId]) {
        return null;
    }
    return this.links[linkId];
};

/**
 * Gets the width of the VisualGraph
 * 
 * @returns {Number} The width
 */
VisualGraph.prototype.getWidth = function() {
    return this.layout.getWidth();
};

/**
 * Gets the height of the VisualGraph
 * 
 * @returns {Number} The height
 */
VisualGraph.prototype.getHeight = function() {
    return this.layout.getHeight();
};

// ---------- Private methods below ----------

/**
 * Gets the edge ID of two Nodes. This is used to store a mapping of pairs of
 * {@link ModelNode}s to their {@link VisualEdge}
 * 
 * @private
 * @param {ModelNode} node1
 * @param {ModelNode} node2
 * @returns {String} The edge ID
 */
VisualGraph.prototype.getEdgeId = function(node1, node2) {
    return Math.min(node1.getId(), node2.getId()) + ":" + Math.max(node1.getId(), node2.getId());
};

/**
 * Creates a new VisualNode from a ModelNode and adds it to this VisualGraph.
 * The new node is returned.
 * 
 * @private
 * @param {ModelNode} node The graph node from which the VisualNode is created
 * @returns {VisualNode} the newly created VisualNode
 */
VisualGraph.prototype.addVisualNodeByNode = function(node) {
    if (!this.nodeIdToVisualNode[node.getId()]) {
        var visualNode = new VisualNode(node);
        visualNode.setFillColor(this.hostPermutation.getHostColor(visualNode.getHost()));
        this.nodeIdToVisualNode[node.getId()] = visualNode;
    }
    return this.nodeIdToVisualNode[node.getId()];
};

/**
 * Removes a the VisualNode representation of the given {@link ModelNode} from
 * the VisualGraph
 * 
 * @private
 * @param {ModelNode} node The node whose VisualNode should be removed.
 */
VisualGraph.prototype.removeVisualNodeByNode = function(node) {
    if (!this.nodeIdToVisualNode[node.getId()]) {
        return;
    }
    delete this.nodeIdToVisualNode[node.getId()];
};

/**
 * Adds to the VisualGraph a VisualEdge that represents the edge between the two
 * parameter ModelNodes. The newly created VisualEdge is returned.
 * 
 * @private
 * @param {ModelNode} node1 One of the end Nodes of the edge that a VisualEdge
 *            is being created for
 * @param {ModelNode} node2 One of the end Nodes of the edge that a VisualEdge
 *            is being created for
 * @returns {VisualEdge} The newly created VisualEdge
 */
VisualGraph.prototype.addVisualEdgeByNodes = function(node1, node2) {
    var edgeId = this.getEdgeId(node1, node2);

    visualNode1 = this.addVisualNodeByNode(node1);
    visualNode2 = this.addVisualNodeByNode(node2);

    var visualEdge = new VisualEdge(visualNode1, visualNode2);
    this.links[edgeId] = visualEdge;
    return visualEdge;
};

/**
 * Removes from the VisualGraph the {@link VisualEdge} representation of the
 * edge between the two parameter ModelNodes
 * 
 * @private
 * @param {ModelNode} node1 One of the end Nodes of the edge whose VisualEdge
 *            should be removed.
 * @param {ModelNode} node2 One of the end Nodes of the edge whose VisualEdge
 *            should be removed.
 */
VisualGraph.prototype.removeVisualEdgeByNodes = function(node1, node2) {
    var edgeId = this.getEdgeId(node1, node2);
    delete this.links[edgeId];
};

/**
 * Adds hidden family edges to the provided VisualNode
 * 
 * @private
 * @param {VisualNode} node
 */
VisualGraph.prototype.addHiddenEdgeToFamily = function(node) {
    var children = node.getChildren();
    for (var i = 0; i < children.length; i++) {
        this.getVisualNodeByNode(children[i]).setHasHiddenParent(true);
    }

    var parents = node.getParents();
    for (var i = 0; i < parents.length; i++) {
        this.getVisualNodeByNode(parents[i]).setHasHiddenChild(true);
    }

};
