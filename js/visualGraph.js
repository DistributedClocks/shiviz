
function VisualGraph(graph, layout, hostColors) {
    this.graph = graph;
    this.layout = layout;
    this.hostColors = hostColors;
    this.nodeIdToVisualNode = {};
    this.links = {};
    
    graph.addObserver(AddNodeEvent, this, function(event, g) {
        g.addVisualNodeByNode(event.getNewNode());
        g.removeVisualEdgeByNodes(event.getPrev(), event.getNext());
        g.addVisualEdgeByNodes(event.getPrev(), event.getNewNode());
        if(!event.getNext().isTail()) {
            g.addVisualEdgeByNodes(event.getNewNode(), event.getNext());
        }
    });
    
    graph.addObserver(RemoveNodeEvent, this, function(event, g) {
        g.removeVisualEdgeByNodes(event.getPrev(), event.getRemovedNode());
        g.removeVisualEdgeByNodes(event.getRemovedNode(), event.getNext());
        if(!event.getNext().isTail()) {
            g.addVisualEdgeByNodes(event.getPrev(), event.getNext());
        }
        g.removeVisualNodeByNode(event.getRemovedNode());
    });
    
    graph.addObserver(AddFamilyEvent, this, function(event, g) {
        g.addVisualEdgeByNodes(event.getParent(), event.getChild());
    });
    
    graph.addObserver(RemoveFamilyEvent, this, function(event, g) {
        g.removeVisualEdgeByNodes(event.getParent(), event.getChild());
    });
    
    graph.addObserver(RemoveHostEvent, this, function(event, g) {
        // just delete head by keeping host to head
        for(var key in g.nodeIdToVisualNode) {
            var visualNode = g.nodeIdToVisualNode[key];
            if(visualNode.getHost() == event.getHost()) {
                delete g.nodeIdToVisualNode[key];
            }
        }
    });
    
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
    this.layout.start(this);
    
};

// for all of these, catch case when you try to add to head or tail
VisualGraph.prototype.addVisualNodeByNode = function(node) {
    if(!this.nodeIdToVisualNode[node.getId()]) {
        var visualNode = new VisualNode(node);
        visualNode.setFillColor(this.hostColors[visualNode.getHost()]);
        this.nodeIdToVisualNode[node.getId()] = visualNode;
    }
    return this.nodeIdToVisualNode[node.getId()];
};

VisualGraph.prototype.removeVisualNodeByNode = function(node) {
    if(!this.nodeIdToVisualNode[node.getId()]) {
        return;
    }
    delete this.nodeIdToVisualNode[node.getId()];
};

VisualGraph.prototype.removeVisualEdgeByNodes = function(node1, node2) {
    var edgeId = this.getEdgeId(node1, node2);
    delete this.links[edgeId];
};

VisualGraph.prototype.addVisualEdgeByNodes = function(node1, node2) {
    var edgeId = this.getEdgeId(node1, node2);
    
    visualNode1 = this.addVisualNodeByNode(node1);
    visualNode2 = this.addVisualNodeByNode(node2);

    var visualEdge = new VisualEdge(visualNode1, visualNode2);
    this.links[edgeId] = visualEdge;
    return visualEdge;
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

