function BuilderNode() {
    Node.apply(this, [null]);
    
}

BuilderNode.prototype = Object.create(Node.prototype);
BuilderNode.prototype.constructor = BuilderNode;
