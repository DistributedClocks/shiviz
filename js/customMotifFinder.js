function CustomMotifFinder(builderGraph) {
    this.builderGraph = builderGraph;
}

CustomMotifFinder.prototype.find = function(graph) {
    var context = this;
    var builderGraph = this.builderGraph;
    
    if(!validateBGraph(builderGraph)) {
        throw new Exception("User defined motifs must be one contiguous graph.", true);
    }

    // we don't need host tracking, since prev/next connectivity constrains host
    // already
    // var hostMatch = {}; // graph host to builderGraph host
    var nodeMatch = {}; // node to builderNode
    var bNodeMatch = {}; // builderNode to node
    // var hostFixCount = {}; // graph host to count
    var used = {}; // nodes already part of other motifs

    var motif = new Motif();

    var startBuilderNode = builderGraph.getNodes()[0];
    var nodes = graph.getNodes();
    for ( var n = 0; n < nodes.length; n++) {
        var cnode = nodes[n];

        setNodeMatch(startBuilderNode, cnode);
        if (searchNode(startBuilderNode)) {
            handleFound();
        }
        removeNodeMatch(cnode);
    }

    return motif;
    
    function validateBGraph(bGraph) {
        var bNodes = bGraph.getNodes();
        var seen = {};
        
        seen[bNodes[0].getId()] = true;
        var stack = [bNodes[0]];
        while(stack.length > 0) {
            var curr = stack.pop();
            
            var nextNodes = curr.getConnections();
            for(var i = 0; i < nextNodes.length; i++) {
                var nextNode = nextNodes[i];
                if(nextNode != null && !seen[nextNode.getId()]) {
                    seen[nextNode.getId()] = true;
                    stack.push(nextNode);
                }
            }
        }
        
        for(var i = 0; i < bNodes.length; i++) {
            if(!seen[bNodes[i].getId()]) {
                return false;
            }
        }
        return true;
    }

    function handleFound() {
        
        var bNodes = builderGraph.getNodes();
        for(var i = 0; i < bNodes.length; i++) {
            var currBNode = bNodes[i];
            var nodeToAdd = bNodeMatch[currBNode.getId()];
            motif.addNode(nodeToAdd);
            used[nodeToAdd.getId()] = true;
            
            var connections = currBNode.getConnections();
            
            for(var j = 0; j < connections.length; j++) {
                if(!connections[j].isHead() && !connections[j].isTail()) {
                    motif.addEdge(bNodeMatch[connections[j].getId()], nodeToAdd);
                }
            }
        }

        hostMatch = {}; // graph host to builderGraph host
        nodeMatch = {}; // node to builderNode
        bNodeMatch = {}; // builderNode to node
        hostFixCount = {}; // graph host to count
    }

    function searchNode(builderNode) {
        var node = bNodeMatch[builderNode.getId()];

        if (used[node.getId()]) {
            return false;
        }

        var bNodeNext = builderNode.getNext();
        var nodeNext = node.getNext();
        if (!bNodeNext.isTail() && (nodeNext.isTail() || !tryAssign([ bNodeNext ], [ nodeNext ]))) {
            return false;
        }

        var bNodePrev = builderNode.getPrev();
        var nodePrev = node.getPrev();
        if (!bNodePrev.isHead() && (nodePrev.isHead() || !tryAssign([ bNodePrev ], [ nodePrev ]))) {
            return false;
        }

        return tryAssign(builderNode.getChildren(), node.getChildren()) && tryAssign(builderNode.getParents(), node.getParents());
    }

    function tryAssign(bNodeGroup, nodeGroup) {

        var newNodeGroup = [];
        for ( var i = 0; i < nodeGroup.length; i++) {
            if (!used[nodeGroup[i].getId()]) {
                newNodeGroup.push(nodeGroup[i]);
            }
        }
        nodeGroup = newNodeGroup;

        // if a bnode has an assignment not in nodegroup, fail
        var nodeGroupSet = {};
        for ( var i = 0; i < nodeGroup.length; i++) {
            nodeGroupSet[nodeGroup[i].getId()] = true;
        }

        var freeBNodeGroup = [];
        for ( var i = 0; i < bNodeGroup.length; i++) {
            var match = bNodeMatch[bNodeGroup[i].getId()];
            if (match == null) {
                freeBNodeGroup.push(bNodeGroup[i]);
            }
            else if (!nodeGroupSet[match.getId()]) { // TODO check
                return false;
            }
        }

        // if node has assignment not in bnodegroup, fail
        var bNodeGroupSet = {};
        for ( var i = 0; i < bNodeGroup.length; i++) {
            bNodeGroupSet[bNodeGroup[i].getId()] = true;
        }

        var freeNodeGroup = [];
        for ( var i = 0; i < nodeGroup.length; i++) {
            var match = nodeMatch[nodeGroup[i].getId()];
            if (!match) {
                freeNodeGroup.push(nodeGroup[i]);
            }
            else if (!bNodeGroupSet[match.getId()]) { // TODO check
                return false;
            }
        }

        if (freeNodeGroup.length < freeBNodeGroup.length) {
            return false;
        }

        if (freeBNodeGroup.length == 0) {
            return true;
        }

        return tryPermutations(freeNodeGroup, [], [], 0);

        function tryPermutations(group, perm, taken, nextLoc) {
            if (nextLoc >= freeBNodeGroup.length) {
                for ( var i = 0; i < freeBNodeGroup.length; i++) {
                    if (!searchNode(freeBNodeGroup[i])) {
                        return false;
                    }
                }
                return true;
            }

            for ( var loc = 0; loc < group.length; loc++) {
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
        // if(!hostFixCount[node.getHost()]) {
        // hostFixCount[node.getHost()] = 0;
        // }
        // hostFixCount[node.getHost()]++;
    }

    function removeNodeMatch(node) {
        if (!nodeMatch[node.getId()]) {
            return;
        }
        delete bNodeMatch[nodeMatch[node.getId()].getId()];
        delete nodeMatch[node.getId()];
        // var host = node.getHost();
        // hostFixCount[host]--;
        // if(hostFixCount[host] == 0) {
        // delete hostMatch[host];
        // }
    }

};
