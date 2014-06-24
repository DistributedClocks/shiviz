function Motif() {
    
    this.nodes = {};
    this.edges = {};
}

Motif.prototype.addNode = function(node) {
    this.nodes[node.getId()] = node;
};

Motif.prototype.addAllNodes = function(nodes) {
    for(var i = 0; i < nodes.length; i++) {
        this.addNode(nodes[i]);
    }
};

Motif.prototype.addEdge = function(node1, node2) {
    this.edges[Motif.getEdgeId(node1, node2)];
};

Motif.prototype.getNodes = function() {
    var array = [];
    for(var key in this.nodes) {
        array.push(this.nodes[key]);
    }
    return array;
};

Motif.getEdgeId = function(node1, node2) {
    var min = Math.min(node1.getId(), node2.getId());
    var max = Math.max(node1.getId(), node2.getId());
    return min + ":" + max;
};