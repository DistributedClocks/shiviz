
function VisualNode(node) {
    this.id = VisualNode.id++;
    this.node = node;
    
    this.x = 0;
    this.y = 0;
    this.radius = 5;
}

VisualNode.id = 0;

VisualNode.prototype.getId = function() {
    return this.id;
};

VisualNode.prototype.getX = function() {
    return this.x;
};

VisualNode.prototype.setX = function(newX) {
    this.x = newX;
};

VisualNode.prototype.getY = function() {
  return this.y;  
};

VisualNode.prototype.setY = function(newY) {
    this.y = newY;
};

VisualNode.prototype.getRadius = function() {
    return this.radius;
};

VisualNode.prototype.setRadius = function(newRadius) {
    this.radius = newRadius;
};

VisualNode.prototype.getText = function() {
    return "TEMPORARY";
//    return this.node.getLogEvents()[0].getText(); // Todo: temporary
};

VisualNode.prototype.getHost = function() {
    return this.node.getHost();
};

VisualNode.prototype.getLineNumber = function() {
    return this.node.getLogEvents()[0].getLineNumber(); // Todo: temporary
};

VisualNode.prototype.isStart = function() {
    return this.node.isHead();
}

