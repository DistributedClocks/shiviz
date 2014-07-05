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
    
    var startBuilderNode = builderGraph.getNodes()[0];
    var nodes = graph.getNodes();
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        nodeMatch[node.getId()] = startBuilderNode;
        var success = searchNode(startBuilderNode);
        delete nodeMatch[node.getId()];
    }
    
    function searchNode(node) {
        
    }
};

