/**
 * @classdesc
 * 
 * <p>
 * This class is responsible for finding Request-Response motifs.
 * </p>
 * 
 * <p>
 * Intuitively, a request response motif is a communication pattern between two
 * hosts where one host sends a message to a second host, and the receiving host
 * then sends something back to the first host.
 * </p>
 * 
 * <p>
 * More formally, a sequence S of k nodes n_1, n_2, n_3 ... n_k forms a
 * Request-Response motif if and only if:
 * <ul>
 * <li>k >= 3</li>
 * <li>n_1 and n_k belong to the same host (which we will call H_s)</li>
 * <li>Nodes n_2 to n_(k-1) inclusive belong to the same host (which we will
 * call H_r)</li>
 * <li>H_s != H_r</li>
 * <li>n_2 is the child of n_1</li>
 * <li>n_k is the child of n_(k-1)</li>
 * <li>Apart from the two family relations above, no nodes in S may have any
 * family</li>
 * <li>nodes n_2 to n_(k-1) inclusive are consecutive</li>
 * <li>The number of nodes between n_2 and n_(k-1) is less than or equal to the
 * parameter maxLEResponder</li>
 * <li>The number of nodes between n_1 and n_k (in the graph, not in S) is less
 * than or equal to the parameter maxLERequester</li>
 * </ul>
 * </p>
 * 
 * <p>
 * The motif itself comprises all nodes in S plus all edges that connect nodes
 * adjacent in the sequence S.
 * </p>
 * 
 * @constructor
 * @extends MotifFinder
 * @param {int} maxLERequester See above for the purpose of this parameter
 * @param {int} maxLEResponder See above for the purpose of this parameter
 */
function RequestResponseFinder(maxLERequester, maxLEResponder) {
    
    /** @private */
    this.maxLERequester = maxLERequester;
    
    /** @private */
    this.maxLEResponder = maxLEResponder;
}

// RequestResponseFinder extends MotifFinder
RequestResponseFinder.prototype = Object.create(MotifFinder.prototype);
RequestResponseFinder.prototype.constructor = RequestResponseFinder;

/**
 * Overrides {@link MotifFinder#find}
 */
RequestResponseFinder.prototype.find = function(graph) {
    var nodes = graph.getNodes();
    var motifGroup = new MotifGroup();
    var seen = {}; // Nodes already part of a motif
    var context = this;

    var traversal = new DFSGraphTraversal(); // define a strategy for traversing the graph

    traversal.setVisitFunction("startNode", function(gt, startNode, state, data) {

        var fail = seen[startNode.getId()] // node is already part of another motif
                || startNode.getChildren().length > 1 //
                || startNode.hasParents();

        if (fail) {
            return;
        }

        gt.addAllNodes(startNode.getChildren(), "responderChain", 0);

    });

    traversal.setVisitFunction("responderChain", function(gt, node, state, chainLength) {

        var fail = seen[node.getId()] // fail if node is already part of another motif
                || node.getParents().length > 1 //
                || (node.hasParents() && chainLength != 0) // or if node isn't the first node in the responder chain and has parents
                || node.isTail() //
                || node.getChildren().length > 1 //
                || chainLength > context.maxLEResponder; //

        if (fail) {
            return;
        }

        if(node.hasChildren()) {
            gt.addAllNodes(node.getChildren(), "endNode", null);
        }
        else {
            gt.addNode(node.getNext(), "responderChain", chainLength + node.getLogEventCount());
        }

    });

    traversal.setVisitFunction("endNode", function(gt, node, state, data) {

        var trail = gt.getTrail();
        var startNode = trail[trail.length - 1];

        var fail = seen[node.getId()] // fail if node is already part of another motif
                || node.hasChildren() //
                || node.getParents().length > 1 //
                || node.getHost() != startNode.getHost(); // start and end nodes must have same host

        if (fail) {
            return;
        }

        var dist = 0;
        while (node != startNode) {
            dist += node.getLogEventCount();
            node = node.getPrev();
        }

        if (dist > context.maxLERequester) {
            return;
        }

        var motif = new Motif();
        motif.addTrail(trail);
        motifGroup.addMotif(motif);

        for ( var i = 0; i < trail.length; i++) {
            seen[trail[i].getId()] = true;
        }

        gt.end();

    });

    for ( var i = 0; i < nodes.length; i++) {
        
        traversal.reset();
        traversal.addNode(nodes[i], "startNode", null);
        traversal.run();
    }

    return motifGroup;
};
