/**
 * Constructs a CustomMotifFinder that will find the motif specified
 * 
 * @classdesc
 * 
 * A CustomMotifFinder is responsible for finding user-defined motifs in a
 * larger graph.
 * 
 * @constructor
 * @extends MotifFinder
 * @param {BuilderGraph} builderGraph The builderGraph that specifies the
 *            user-defined motif
 */
function CustomMotifFinder(builderGraph) {

    /** @private */
    this.builderGraph = builderGraph;
}

// CustomMotifFinder extends MotifFinder
CustomMotifFinder.prototype = Object.create(MotifFinder.prototype);
CustomMotifFinder.prototype.constructor = CustomMotifFinder;

/**
 * Overrides {@link MotifFinder#find}
 */
CustomMotifFinder.prototype.find = function(graph) {

    var context = this;

    // This is the motif template we are looking for
    var builderGraph = this.builderGraph;

    if (!validateBGraph(builderGraph)) {
        throw new Exception("User defined motifs must be one contiguous graph.", true);
    }

    var nodeMatch = {}; // node to builderNode
    var bNodeMatch = {}; // builderNode to node
    var hostMatch = {}; // graph host to builderGraph host
    var hostNumBound = {}; // graph host to number of nodes bound to that host
    var inOtherMotif = {}; // nodes already part of other motifs

    var motifGroup = new MotifGroup();
    
    var startBuilderNode = builderGraph.getNodes()[0];
    var nodes = graph.getNodes();
    for (var n = 0; n < nodes.length; n++) {
        var cnode = nodes[n];

        if (!setNodeMatch(startBuilderNode, cnode)) {
            // jump over one iteration in the loop
            continue;
        }
        if (searchNode(startBuilderNode)) {
            handleFound();
        }
        removeNodeMatch(cnode);
    }

    return motifGroup;

    /*
     * This method determines if a BuilderGraph is one contiguous graph.
     */
    function validateBGraph(bGraph) {
        var bNodes = bGraph.getNodes();
        var seen = {};

        seen[bNodes[0].getId()] = true;
        var stack = [ bNodes[0] ];

        // dfs to visit nodes
        while (stack.length > 0) {
            var curr = stack.pop();

            var nextNodes = curr.getConnections();
            for (var i = 0; i < nextNodes.length; i++) {
                var nextNode = nextNodes[i];
                if (nextNode != null && !seen[nextNode.getId()]) {
                    seen[nextNode.getId()] = true;
                    stack.push(nextNode);
                }
            }
        }

        // If there are nodes unvisited by the dfs, graph isn't contiguous
        for (var i = 0; i < bNodes.length; i++) {
            if (!seen[bNodes[i].getId()]) {
                return false;
            }
        }
        return true;
    }

    /*
     * This function is invoked when a motif has been found. It adds the
     * appropriate edges and nodes to the motif by examining the current
     * matching of nodes.
     */
    function handleFound() {

        var motif = new Motif();
        
        var bNodes = builderGraph.getNodes();
        for (var i = 0; i < bNodes.length; i++) {
            var currBNode = bNodes[i];
            var nodeToAdd = bNodeMatch[currBNode.getId()];
            motif.addNode(nodeToAdd);
            inOtherMotif[nodeToAdd.getId()] = true;

            var connections = currBNode.getConnections();

            for (var j = 0; j < connections.length; j++) {
                if (!connections[j].isHead() && !connections[j].isTail()) {
                    motif.addEdge(bNodeMatch[connections[j].getId()], nodeToAdd);
                }
            }
        }
        
        clearSearchState();
        motifGroup.addMotif(motif);
    }

    /*
     * This method searches for a valid motif, starting at the provided
     * builderNode. Thus, the provided builderNode must already have a match to
     * a graph node. True is returned upon successfully finding a valid motif.
     * False otherwise.
     */
    function searchNode(bNode) {
        var node = bNodeMatch[bNode.getId()];

        var state = saveSearchState();
        
        var pass = tryMatchAdjacent(bNode.getNext(), node.getNext()) //
                && tryMatchAdjacent(bNode.getPrev(), node.getPrev()) //
                && tryMatch(bNode.getChildren(), node.getChildren()) //
                && tryMatch(bNode.getParents(), node.getParents()); //
        
        if(!pass) {
            loadSearchState(state);
        }
        
        return pass;
    }

    /*
     * Tries and match a builderNode parent/child to a modelNode parent/child.
     * True is returned on success, false otherwise.
     */
    function tryMatchAdjacent(bNode, node) {
        if (bNode.isDummy()) {
            return true;
        }

        if (node.isDummy()) {
            return false;
        }

        var bmatch = bNodeMatch[bNode.getId()];
        var nmatch = nodeMatch[node.getId()];

        if (!bmatch && !nmatch) {
            // return false if we can't match bNode to node
            if (!setNodeMatch(bNode, node)) {
                return false;
            }

            // if search succeeds, return true
            if (searchNode(bNode)) {
                return true;
            }

            // remove matching and fail
            removeNodeMatch(node);
            return false;
        }
        else {
            // if bNode or node already has a match, they must be matched to
            // each other
            return bmatch == node;
        }
    }

    /*
     * This method tries to match the provided builderNodes to the provided
     * graph nodes. True is returned on success, false otherwise. For the match
     * to be considered a success, each BuilderNode must be matched to a graph
     * node, and each ModelNode must be matched to a BuilderNode
     */
    function tryMatch(bNodeGroup, nodeGroup) {

        // Remove all used nodes (nodes part of a motif already) from nodeGroup.
        // In addition, removes dummy nodes
        nodeGroup = nodeGroup.filter(function(elem) {
            return !inOtherMotif[elem.getId()];
        });

        // Creates a set out of nodeGroup, so membership test is O(1)
        var nodeGroupSet = {};
        for (var i = 0; i < nodeGroup.length; i++) {
            nodeGroupSet[nodeGroup[i].getId()] = true;
        }

        // Creates a set out of bNodeGroup, so membership test is O(1)
        var bNodeGroupSet = {};
        for (var i = 0; i < bNodeGroup.length; i++) {
            bNodeGroupSet[bNodeGroup[i].getId()] = true;
        }

        /*
         * We populate an array of "free" bNodes - bNodes that haven't yet been
         * matched to a node. If we encounter an already matched bNode, its
         * match must be part of nodeGroup (otherwise we return false
         * immediately)
         */
        var freeBNodeGroup = []; // unmatched bNodes
        for (var i = 0; i < bNodeGroup.length; i++) {
            var match = bNodeMatch[bNodeGroup[i].getId()];
            if (match == null) {
                freeBNodeGroup.push(bNodeGroup[i]);
            }
            else if (!nodeGroupSet[match.getId()]) { // TODO check
                return false;
            }
        }

        // The process is repeated for graph nodes
        var freeNodeGroup = [];
        for (var i = 0; i < nodeGroup.length; i++) {
            var match = nodeMatch[nodeGroup[i].getId()];
            if (!match) {
                freeNodeGroup.push(nodeGroup[i]);
            }
            else if (!bNodeGroupSet[match.getId()]) { // TODO check
                return false;
            }
        }

        // If there are fewer free nodes than free bNodes, fail
        if (freeNodeGroup.length != freeBNodeGroup.length) {
            return false;
        }

        return tryPermutations(freeNodeGroup, [], [], 0);

        /*
         * This inner-inner function tries all matchings of elements of
         * freeNodeGroup to freeBNodeGroup. Essentially, we are generating all
         * nPr permutations, where n = freeNodeGroup.length and r =
         * freeBNodeGroup.length
         */
        function tryPermutations(group, perm, taken, nextLoc) {
            if (nextLoc >= freeBNodeGroup.length) {
                for (var i = 0; i < freeBNodeGroup.length; i++) {
                    if (!searchNode(freeBNodeGroup[i])) {
                        return false;
                    }
                }
                return true;
            }

            for (var loc = 0; loc < group.length; loc++) {
                if (taken[loc]) {
                    continue;
                }

                var node = group[loc];
                if (!setNodeMatch(freeBNodeGroup[nextLoc], node)) {
                    continue;
                }
                taken[loc] = true;

                if (tryPermutations(group, perm, taken, nextLoc + 1)) {
                    return true;
                }

                taken[loc] = false;
                removeNodeMatch(node);
            }
            return false;
        }
    }

    /*
     * Matches bNode and node. Neither must already have a match. If matching
     * bNode and node is invalid, this method returns false. This method returns
     * true otherwise
     */
    function setNodeMatch(bNode, node) {
        if (nodeMatch[node.getId()] || bNodeMatch[bNode.getId()]) {
            throw new Exception("bNode or node already has a match");
        }

        var bNodeHost = bNode.getHost();
        var nodeHost = node.getHost();

        var fail = inOtherMotif[node.getId()] //
                || (hostMatch[nodeHost] && hostMatch[nodeHost] != bNodeHost) //
                || (!matchHostConstraint());

        if (fail) {
            return false;
        }
        else {
        }

        // If no nodes are bound to this host, set the count to 0
        if (!hostNumBound[nodeHost]) {
            hostNumBound[nodeHost] = 0;
        }
        // Then, increment the count
        hostNumBound[nodeHost]++;

        // Save the matches
        hostMatch[nodeHost] = bNodeHost;
        nodeMatch[node.getId()] = bNode;
        bNodeMatch[bNode.getId()] = node;

        return true;

        // Check to see if the graph node's host matches the host constraint from the builder node
        function matchHostConstraint() {
            if (bNode.hasHostConstraint) {
                var regexp = new RegExp(bNodeHost);
                return regexp.test(nodeHost);
            } else {
                return true;
            }
        }
    }

    function removeNodeMatch(node) {
        if (!nodeMatch[node.getId()]) {
            return;
        }
        delete bNodeMatch[nodeMatch[node.getId()].getId()];
        delete nodeMatch[node.getId()];
        hostNumBound[node.getHost()]--;

        if (hostNumBound[node.getHost()] == 0) {
            delete hostMatch[node.getHost()];
        }
    }
    
    
    function saveSearchState() {
        return {
            nodeMatch: Util.objectShallowCopy(nodeMatch),
            bNodeMatch: Util.objectShallowCopy(bNodeMatch),
            hostMatch: Util.objectShallowCopy(hostMatch),
            hostNumBound: Util.objectShallowCopy(hostNumBound)
        };
    }
    
    function loadSearchState(state) {
        nodeMatch = state.nodeMatch;
        bNodeMatch = state.bNodeMatch;
        hostMatch = state.hostMatch;
        hostNumBound = state.hostNumBound;
    }
    
    function clearSearchState() {
        nodeMatch = {};
        bNodeMatch = {};
        hostMatch = {};
        hostNumBound = {};
    }

};