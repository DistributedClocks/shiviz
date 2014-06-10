
/**
 * 
 * @param node
 * @constructor
 */
function VisualNode(node) {
    this.id = VisualNode.id++;
    this.node = node;
    
    this.x = 0;
    this.y = 0;
    this.radius = 5;
    this.fillColor = 0;
    this.label = "";
}

VisualNode.id = 0;

//why is this needed?
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

VisualNode.prototype.getFillColor = function() {
    return this.fillColor;
};

VisualNode.prototype.setFillColor = function(newFillColor) {
    this.fillColor = newFillColor;
};

VisualNode.prototype.getText = function() {
    if(this.isStart()) {
        return this.getHost();
    }
    return this.node.getLogEvents()[0].getText();
};

VisualNode.prototype.getLabel = function() {
    return this.label;
};

VisualNode.prototype.setLabel = function(newLabel) {
    this.label = newLabel;
};

VisualNode.prototype.getHost = function() {
    return this.node.getHost();
};

VisualNode.prototype.getLineNumber = function() {
    return this.node.getLogEvents()[0].getLineNumber(); // Todo: temporary
};

VisualNode.prototype.isStart = function() {
    return this.node.isHead();
};

