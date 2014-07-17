function GraphTraversal() {
    
    this.visitFunctions = {};
    
    this.defaultVisitFunction = null;
    
    this.state = null;
    
    this.currentNode = null;
    
    this.currentData = null;
    
    this.parent = {};
    
    this.hasEnded = false;
}

GraphTraversal.prototype.setVisitFunction = function(state, fn) {
    this.visitFunctions[state] = fn;
};

GraphTraversal.prototype.setState = function(state) {
    this.state = state;
};

GraphTraversal.prototype.setCurrentNode = function(node) {
    this.currentNode = node;
};

GraphTraversal.prototype.end = function() {
    this.hasEnded = true;
};

GraphTraversal.prototype.step = function() {
    if(this.hasEnded) {
        return false;
    }
    
    if(this.state == null || !this.visitFunctions[this.state]) {
        if(this.defaultVisitFunction == null) {
            throw new Exception(); //TODO: fill in exception
        }
        this.defaultVisitFunction(this, this.currentNode, state, data);
    }
    else {
        this.visitFunctions[this.state](this, this.currentNode, state, data);
    }
    
    return true;
};

GraphTraversal.prototype.run = function() {

    var hasRun = false;
    while(this.step()) {
        hasRun = true;
    }
    return hasRun;
};

GraphTraversal.prototype.getTrail = function(node) {
    if(!node) {
        node = this.currentNode;
    }
    
    var trail = [];
    while(node != null) {
        trail.push(node);
        node = this.parent[node.getId()];
    }
    return trail;
};