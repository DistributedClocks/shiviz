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
 *        user-defined motif
 */
function CustomMotifFinder(builderGraph) {

    /** @private */
    this.builderGraph = builderGraph;
}

//CustomMotifFinder extends MotifFinder
CustomMotifFinder.prototype = Object.create(MotifFinder.prototype);
CustomMotifFinder.prototype.constructor = CustomMotifFinder;

/**
 * 
 */
CustomMotifFinder.prototype.find = function(graph) {

    var context = this;
    var builderGraph = this.builderGraph;

    if (!validateBGraph(builderGraph)) {
        throw new Exception("User defined motifs must be one contiguous graph.", true);
    }

    var nodeMatch = {}; // node to builderNode
    var bNodeMatch = {}; // builderNode to node
    var used = {}; // nodes already part of other motifs

    var motif = new Motif();

    var startBuilderNode = builderGraph.getNodes()[0];
    var nodes = graph.getNodes();
    for (var n = 0; n < nodes.length; n++) {
        var cnode = nodes[n];

        setNodeMatch(startBuilderNode, cnode);
        if (searchNode(startBuilderNode)) {
            handleFound();
        }
        removeNodeMatch(cnode);
    }

    return motif;

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

        var bNodes = builderGraph.getNodes();
        for (var i = 0; i < bNodes.length; i++) {
            var currBNode = bNodes[i];
            var nodeToAdd = bNodeMatch[currBNode.getId()];
            motif.addNode(nodeToAdd);
            used[nodeToAdd.getId()] = true;

            var connections = currBNode.getConnections();

            for (var j = 0; j < connections.length; j++) {
                if (!connections[j].isHead() && !connections[j].isTail()) {
                    motif.addEdge(bNodeMatch[connections[j].getId()], nodeToAdd);
                }
            }
        }

        nodeMatch = {}; // node to builderNode
        bNodeMatch = {}; // builderNode to node
    }

    /*
     * This method searches for a valid motif, starting at the provided
     * builderNode. Thus, the provided builderNode must already have a match to
     * a graph node. True is returned upon successfully finding a valid motif.
     * False otherwise.
     */
    function searchNode(builderNode) {
        var node = bNodeMatch[builderNode.getId()];

        // if builderNode's match is already part of another motif, return
        // false.
        if (used[node.getId()]) {
            return false;
        }

        // tryMatch the next nodes of builderNode and it's match.
        var bNodeNext = builderNode.getNext();
        var nodeNext = node.getNext();
        if (!bNodeNext.isTail() && (nodeNext.isTail() || !tryMatch([ bNodeNext ], [ nodeNext ]))) {
            return false;
        }

        // tryMatch the prev nodes of builderNode and it's match.
        var bNodePrev = builderNode.getPrev();
        var nodePrev = node.getPrev();
        if (!bNodePrev.isHead() && (nodePrev.isHead() || !tryMatch([ bNodePrev ], [ nodePrev ]))) {
            return false;
        }

        // tryMatch children and parents
        return tryMatch(builderNode.getChildren(), node.getChildren()) && tryMatch(builderNode.getParents(), node.getParents());
    }

    /*
     * This method tries to match the provided builderNodes to the provided
     * graph nodes. True is returned on success, false otherwise. For the match
     * to be considered a success, each BuilderNode must be matched to a graph
     * node. However, it is not necessary that each node be matched to a
     * builderNode
     */
    function tryMatch(bNodeGroup, nodeGroup) {

        // Remove all used nodes (nodes part of a motif already) from nodeGroup
        var unusedNodeGroup = [];
        for (var i = 0; i < nodeGroup.length; i++) {
            if (!used[nodeGroup[i].getId()]) {
                unusedNodeGroup.push(nodeGroup[i]);
            }
        }
        nodeGroup = unusedNodeGroup;

        /*
         * For each bNode, we check to see if it has already been matched. If
         * not, then we add it to an array containing un-matched bNodes.
         * Otherwise, we make sure that the bNode's match is part of nodeGroup,
         * and we return false if that's not the case
         */
        var nodeGroupSet = {};
        for (var i = 0; i < nodeGroup.length; i++) {
            nodeGroupSet[nodeGroup[i].getId()] = true;
        }

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
        var bNodeGroupSet = {};
        for (var i = 0; i < bNodeGroup.length; i++) {
            bNodeGroupSet[bNodeGroup[i].getId()] = true;
        }

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
        if (freeNodeGroup.length < freeBNodeGroup.length) {
            return false;
        }

        // If there are no free bNodes, return true
        if (freeBNodeGroup.length == 0) {
            return true;
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
                setNodeMatch(freeBNodeGroup[nextLoc], node);
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

    function setNodeMatch(bNode, node) {
        if (!!nodeMatch[node.getId()]) {
            removeNodeMatch(node);
        }
        nodeMatch[node.getId()] = bNode;
        bNodeMatch[bNode.getId()] = node;
    }

    function removeNodeMatch(node) {
        if (!nodeMatch[node.getId()]) {
            return;
        }
        delete bNodeMatch[nodeMatch[node.getId()].getId()];
        delete nodeMatch[node.getId()];
    }

};
