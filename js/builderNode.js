BuilderNode.prototype = Object.create(Node.prototype);
BuilderNode.prototype.constructor = BuilderNode;

function BuilderNode() {
    Node.apply(this);
    
}
