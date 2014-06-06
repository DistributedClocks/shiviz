
function VisualGraph(graph, layout) {
    this.graph = graph;
    this.nodeIdToVisualNode = {};
    this.links = {};
    
    var nodes = graph.getAllNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(!node.isTail()) {
            this.nodeIdToVisualNode[node.getId()] = new VisualNode(node);
        }
    }
    
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var visualNode = this.nodeIdToVisualNode[node.getId()];
        
        if(node.isHead() || node.isTail()) {
            continue;
        }
        
        var prev = node.getPrev();
        var linkId = Math.min(node.getId(), prev.getId()) + ":" + Math.max(node.getId(), prev.getId());
        this.links[linkId] = new VisualEdge(this.nodeIdToVisualNode[prev.getId()], visualNode);
        
        var connect = node.getChildren();
        for(var j = 0; j < connect.length; j++) {
            var child = connect[j];
            var childLinkId = Math.min(node.getId(), child.getId()) + ":" + Math.max(node.getId(), child.getId());
            this.links[childLinkId] = new VisualEdge(visualNode, this.nodeIdToVisualNode[child.getId()]);
        }
        
    }
    
    layout.start(this);
}

VisualGraph.prototype.getHosts = function() {
    return this.graph.getHosts();
};

VisualGraph.prototype.getVisualNodes = function() {
    var nodes = [];
    for(var id in this.nodeIdToVisualNode) {
        nodes.push(this.nodeIdToVisualNode[id]);
    }
    return nodes;
};

VisualGraph.prototype.getVisualEdges = function() {
    var edges = [];
    for(var id in this.links) {
        edges.push(this.links[id]);
    }
    return edges;
};

VisualGraph.prototype.getVisualNodeByNode = function(node) {
    var id = node.getId();
    if(!this.nodeIdToVisualNode[id]) {
        return null;
    }
    return this.nodeIdToVisualNode[id];
};

VisualGraph.prototype.getVisualEdgeByNodes = function(node1, node2) {
    var linkId = Math.min(node1.getId(), node2.getId()) + ":" + Math.max(node1.getId(), node2.getId());
    if(!this.links[linkId]) {
        return null;
    }
    return this.links[linkId];
};

