
function VisualGraph(graph, layout, hostColors) {
    this.graph = graph;
    this.layout = layout;
    this.hostColors = hostColors;
    this.nodeIdToVisualNode = {};
    this.links = {};
    
    var nodes = graph.getAllNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(!node.isTail()) {
            var visualNode = new VisualNode(node);
            this.nodeIdToVisualNode[node.getId()] = visualNode;
            visualNode.setFillColor(hostColors[visualNode.getHost()]);
        }
    }
    
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var visualNode = this.nodeIdToVisualNode[node.getId()];
        
        if(node.isHead() || node.isTail()) {
            continue;
        }
        
        var prev = node.getPrev();
        var linkId = this.getEdgeId(node, prev);
        this.links[linkId] = new VisualEdge(this.nodeIdToVisualNode[prev.getId()], visualNode);
        
        var connect = node.getChildren();
        for(var j = 0; j < connect.length; j++) {
            var child = connect[j];
            var childLinkId = this.getEdgeId(node,child);
            this.links[childLinkId] = new VisualEdge(visualNode, this.nodeIdToVisualNode[child.getId()]);
        }
        
    }
    
    layout.start(this);
}

VisualGraph.prototype.update = function() {
    var nodeIds = {};
    
    var nodes = this.graph.getAllNodes();
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(node.isTail()) {
            continue;
        }
        
        nodeIds[node.getId()] = true;
        if(!this.nodeIdToVisualNode[node.getId()]) {
            var visualNode = new VisualNode(node);
            this.nodeIdToVisualNode[node.getId()] = visualNode;
            visualNode.setFillColor(this.hostColors[visualNode.getHost()]);
        } 
    }
    
    for(var id in this.nodeIdToVisualNode) {
        if(!nodeIds[id]) {
            delete this.nodeIdToVisualNode[id];
        }
    }
    
    var linkIds = {};
    
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var visualNode = this.nodeIdToVisualNode[node.getId()];
        
        if(node.isHead() || node.isTail()) {
            continue;
        }
        
        var prev = node.getPrev();
        var linkId = this.getEdgeId(node, prev);
        linkIds[linkId] = true;
        if(!this.links[linkId]) {
            this.links[linkId] = new VisualEdge(this.nodeIdToVisualNode[prev.getId()], visualNode);
        }
        
        var connect = node.getChildren();
        for(var j = 0; j < connect.length; j++) {
            var child = connect[j];
            var childLinkId = this.getEdgeId(node,child);
            linkIds[childLinkId] = true;
            if(!this.links[childLinkId]) {
                this.links[childLinkId] = new VisualEdge(visualNode, this.nodeIdToVisualNode[child.getId()]);
            }
        }
    }
    
    for(var linkId in this.links) {
        if(!linkIds[linkId]) {
            delete this.links[linkId];
        }
    }
    
    this.layout.start(this);
    
};

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
    var linkId = this.getEdgeId(node1, node2);
    if(!this.links[linkId]) {
        return null;
    }
    return this.links[linkId];
};

VisualGraph.prototype.getEdgeId = function(node1, node2) {
    return Math.min(node1.getId(), node2.getId()) + ":" + Math.max(node1.getId(), node2.getId());
};




VisualGraph.prototype.getWidth = function() {
    return this.layout.getWidth();
};

VisualGraph.prototype.getHeight = function() {
    return this.layout.getHeight();
};

