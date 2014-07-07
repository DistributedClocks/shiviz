function CustomMotifFinder(graph, builderGraph) {
    this.graph = graph;
    this.builderGraph = builderGraph;
}

CustomMotifFinder.prototype.find = function() {
    var context = this;
    var graph = this.graph;
    var builderGraph = this.builderGraph;
    
    var hostMatch = {}; // graph host to builderGraph host
    var nodeMatch = {}; // node to builderNode
    var bNodeMatch = {}; //builderNode to node
    var hostFixCount = {}; // graph host to count
    
    var startBuilderNode = builderGraph.getNodes()[0];
    var nodes = graph.getNodes();
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        setNodeMatch(startBuilderNode, node);
        if(searchNode(startBuilderNode)) {
            console.log("FOUND!!!"); //TODO replace
        }
        removeNodeMatch(node);
    }
    
    function searchNode(builderNode) {
        var node = bNodeMatch[builderNode.getId()];
        
        return tryAssign(builderNode.getChildren(), node.getChildren())
        || tryAssign(builderNode.getParents(), node.getParents())
        || tryAssign([builderNode.getNext()], [node.getNext()])
        || tryAssign([builderNode.getPrev()], [node.getPrev()]);
    }
    
    function tryAssign(bNodeGroup, nodeGroup) {
        
        // if a bnode has an assignment not in nodegroup, fail
        var nodeGroupSet = {};
        for(var i = 0; i < nodeGroup.length; i++) {
            nodeGroupSet[nodeGroup[i].getId()] = true;
        }
        
        var freeBNodeGroup = [];
        for(var i = 0; i < bNodeGroup.length; i++) {
            var match = bNodeMatch[bNodeGroup[i].getId()];
            if(match == null) {
                freeBNodeGroup.push(bNodeGroup[i]);
            }
            else if(!nodeGroupSet[match.getId()]) {
                return false;
            }
        }
        
        // if node has assignment not in bnodegroup, fail
        var bNodeGroupSet = {};
        for(var i = 0; i < bNodeGroup.length; i++) {
            bNodeGroupSet[bNodeGroup[i].getId()] = true;
        }
        
        var freeNodeGroup = [];
        for(var i = 0; i < nodeGroup.length; i ++) {
            var match = nodeMatch(nodeGroup[i]);
            if(!match) {
                freeNodeGroup.push(match);
            }
            else if(!bNodeGroupSet[match.getId()]){
                return false;
            }
        }
        
        if(freeNodeGroup.length < freeBNodeGroup.length) {
            return false;
        }
        
        tryPermutations(freeNodeGroup, [], [], 0);
        
        function tryPermutations(group, perm, taken, nextLoc) {
            if(nextLoc >= group.length) {
                for(var i = 0; i < freeBNodeGroup.length; i++) {
                    if(!searchNode(freeBNodeGroup[i])) {
                        return false;
                    }
                }
                return true;
            }

            for(var loc = 0; loc < group.length; loc++) {
                if(taken[loc]) {
                    continue;
                }
//                    perm[nextLoc] = group[loc]; //todo: no need?
                var node = group[loc];
                setNodeMatch(freeBNodeGroup[loc], node);
                taken[loc] = true;
                
                tryPermutations(group, perm, taken, nextLoc + 1);
                
                taken[loc] = false;
                removeNodeMatch(node);
            }
            return false;
        }
    }
    
    function setNodeMatch(bNode, node) {
        if(!!nodeMatch[node.getId()]) {
            removeNodeMatch(node);
        }
        nodeMatch[node.getId()] = bNode;
        bNodeMatch[bNode.getId()] = node;
        if(!hostMatch[node.getHost()]) {
            hostMatch[node.getHost()] = 0;
        }
        hostMatch[node.getHost()]++;
    }
    
    function removeNodeMatch(node) {
        if(!nodeMatch[node.getId()]) {
            return;
        }
        delete nodeMatch[node.getId()];
        var host = node.getHost();
        hostFixCount[host]--;
        if(hostFixCount[host] == 0) {
            delete hostMatch[host];
        }
    }
    
};

