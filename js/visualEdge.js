
function VisualEdge(sourceVisualNode, targetVisualNode) {
    this.sourceVisualNode = sourceVisualNode;
    this.targetVisualNode = targetVisualNode;
    this.width = 1;
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