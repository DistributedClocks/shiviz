DFSGraphTraversal.prototype = Object.create(GraphTraversal.prototype);
DFSGraphTraversal.prototype.constructor = DFSGraphTraversal;

function DFSGraphTraversal() {
    GraphTraversal.call(this);
    
    this.stack = [];
}

DFSGraphTraversal.prototype.addNode = function(node, state, data) {
    this.stack.push({
        node: node,
        state: state,
        data: data
    });
    
    this.parent[node.getId()] = this.currentNode;
};

DFSGraphTraversal.prototype.step = function() {

    if(this.stack.length == 0 || this.hasEnded) {
        return false;
    }
    
    var curr = this.stack.pop();
    
    this.currentNode = curr.node;
    this.state = curr.state;
    this.currentData = curr.data;
    
    if(this.state == null || !this.visitFunctions[this.state]) {
        if(this.defaultVisitFunction == null) {
            throw new Exception(); //TODO: fill in exception
        }
        this.defaultVisitFunction(this, this.currentNode, this.state, this.currentData);
    }
    else {
        this.visitFunctions[this.state](this, this.currentNode, this.state, this.currentData);
    }
    
    return true;
};