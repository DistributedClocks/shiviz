/**
 * @classdesc
 * 
 * A Motif is a set of edges and nodes that are a subgraph of a Graph. Motif can
 * be used by other classes to identify or store interesting or useful parts of
 * a larger graph. The exact importance of the edges and nodes stored is left up
 * to the utilizing class.
 * 
 * @constructor
 */
function Motif() {

    /** @private */
    this.nodes = {};

    /** @private */
    this.edges = {};
}

/**
 * Adds a node to this motif
 * 
 * @param {Node} node the node to add
 */
Motif.prototype.addNode = function(node) {
    this.nodes[node.getId()] = node;
};

/**
 * Adds multiple nodes to this motif
 * 
 * @param {Array<Node>} nodes An array containing the nodes to add
 */
Motif.prototype.addAllNodes = function(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        this.addNode(nodes[i]);
    }
};

/**
 * Gets all nodes that are contained in this motif.
 * 
 * @returns {Array}
 */
Motif.prototype.getNodes = function() {
    var array = [];
    for (var key in this.nodes) {
        array.push(this.nodes[key]);
    }
    return array;
};

/**
 * Adds an edge to this motif, given the two nodes that the edge connects. Note
 * that this class does not check that the added edge actually exists anywhere
 * or is otherwise meaningful in any way. Such checks are the responsibility of
 * classes utilizing Motif
 * 
 * @param {Node} node1 One of the nodes the edge connects. Must not be identical
 *            to node2
 * @param {Node} node2 One of the nodes the edge connects. Must not be identical
 *            to node1
 */
Motif.prototype.addEdge = function(node1, node2) {
    this.edges[Motif.getEdgeId(node1, node2)] = [ node1, node2 ];
};

/**
 * Adds multiple edges to this motif.
 * 
 * @param {Array<Array<Node>>} edges The edges to add. edges[i] is the i-th
 *            edge to be added. edge[i][0] and edge[i][1] are the two nodes the
 *            i-th edge connects. For example, if you want to add two edges: one
 *            from x to y and another from t to w, edges would be [ [x, y], [t,
 *            w] ]
 */
Motif.prototype.addAllEdges = function(edges) {
    for (var i = 0; i < edges.length; i++) {
        this.addEdge(edges[i][0], edges[i][1]);
    }
};

/**
 * Gets all the edges in this motif
 * 
 * @returns {Array<Array<Node>>} the edges in this motif. edges[i] is the i-th
 *          edge in the motif. edge[i][0] and edge[i][1] are the two nodes the
 *          i-th edge connects. For example, if there are two edges: one from x
 *          to y and another from t to w, the returned array would be [ [x, y],
 *          [t, w] ]
 */
Motif.prototype.getEdges = function() {
    var edges = [];
    for (var key in this.edges) {
        edges.push(this.edges[key]);
    }
    return edges;
};

/**
 * Merges two motifs. All of the edges and nodes in other will be added to this.
 * The other motif will be unmodified
 * 
 * @param {Motif} other the other motif to merge into this one
 */
Motif.prototype.merge = function(other) {
    this.addAllNodes(other.getNodes());
    this.addAllEdges(other.getEdges());
};

/**
 * 
 * @private
 */
Motif.getEdgeId = function(node1, node2) {
    var min = Math.min(node1.getId(), node2.getId());
    var max = Math.max(node1.getId(), node2.getId());
    return min + ":" + max;
};