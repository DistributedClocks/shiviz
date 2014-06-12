
function SpaceTimeLayout(width, delta) {
    this.width = width;
    this.delta = delta;
    this.height = 0;
}

SpaceTimeLayout.prototype.start = function(visualGraph) {
    
    this.height = 0;
    
    var nodeToNumParents = {};
    var nodeToChildren = {};
    
    var nodes = visualGraph.getVisualNodes();
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.setY(0);
        nodeToNumParents[node.getId()] = 0;
        nodeToChildren[node.getId()] = [];
    }
    
    var edges = visualGraph.getVisualEdges();
    for(var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        var source = edge.getSourceVisualNode();
        var target = edge.getTargetVisualNode();
        nodeToNumParents[target.getId()]++;
        nodeToChildren[source.getId()].push(target);
    }
    
    var noParents = [];
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(nodeToNumParents[node.getId()] == 0) {
            noParents.push(node);
        }
    }
    
    var hosts = visualGraph.getHosts();
    var hostNameToIndex = {};
    for(var i = 0; i < hosts.length; i++) {
        hostNameToIndex[hosts[i]] = i;
    }
    
    while(noParents.length > 0) {
        var current = noParents.pop();
        
        this.height = Math.max(this.height, current.getY());
        current.setX(this.width / hosts.length * hostNameToIndex[current.getHost()] + this.width / hosts.length / 2);
        
        var children = nodeToChildren[current.getId()];
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            nodeToNumParents[child.getId()]--;
            if(nodeToNumParents[child.getId()] == 0) {
                noParents.push(child);
            }
            child.setY(Math.max(child.getY(), current.getY() + this.delta));
        }
    }

    this.height += 2 * this.delta;
    
};

SpaceTimeLayout.prototype.getHeight = function() {
    return this.height;
};

SpaceTimeLayout.prototype.getWidth = function() {
    return this.width;
};
