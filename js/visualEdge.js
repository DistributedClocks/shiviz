
function VisualEdge(sourceVisualNode, targetVisualNode) {
    this.sourceVisualNode = sourceVisualNode;
    this.targetVisualNode = targetVisualNode;
    this.width = 1;
    
//    this.x1 = 0;
//    this.y1 = 0;
//    this.x2 = 0;
//    this.y2 = 0;
}

VisualEdge.prototype.getSourceVisualNode = function() {
    return this.sourceVisualNode;
};

VisualEdge.prototype.getTargetVisualNode = function() {
    return this.targetVisualNode;
};

VisualEdge.prototype.getWidth = function() {
    return this.width;
};

VisualEdge.prototype.setWidth = function(newWidth) {
    this.width = newWidth;
};

//VisualEdge.prototype.getX1 = function() {
//    return this.x1;
//};
//
//VisualEdge.prototype.setX1 = function(newX1) {
//    this.x1 = newX1;
//};
//
//VisualEdge.prototype.getY1 = function() {
//    return this.y1;
//};
//
//VisualEdge.prototype.setY1 = function(newY1) {
//    this.y1 = newY1;
//};
//
//VisualEdge.prototype.getX2 = function() {
//    return this.x2;
//};
//
//VisualEdge.prototype.setX2 = function(newX2) {
//    this.x2 = newX2;
//};
//
//VisualEdge.prototype.getY2 = function() {
//    return this.y2;
//};
//
//VisualEdge.prototype.setY2 = function(newY2) {
//    this.y2 = newY2;
//};