/**
 * Constructs a node with the provided x and y coordinates and color and is associated with the provided {@link GraphBuilder}
 * 
 * @classdesc
 * 
 * A GraphBuilderNode is a node that is a component of a {@link GraphBuilder}.
 * 
 * @constructor
 * @param graphBuilder
 * @param x
 * @param y
 * @param {Boolean} tmp This does something albert should explain
 * @param color
 */
function GraphBuilderNode(graphBuilder, x, y, tmp, color) {
    
    /** @private */
    this.id = GraphBuilderNode.id++;
    
    /** @private */
    this.graphBuilder = graphBuilder;
    
    /** @private */
    this.x = parseFloat(x);
    
    /** @private */
    this.y = parseFloat(y);
    
    /** @private */
    this.state = tmp ? "tmp" : false;
    
    /** @private */
    this.parents = [];
    
    /** @private */
    this.children = [];
    
    /** @private */
    this.lines = [];
    
    /** @private */
    this.color = color;

    var context = this;
    
    /** @private */
    this.circle = $(Util.svgElement("circle")).attr({
        "r": 5,
        "cx": x,
        "cy": y,
        "fill": context.color
    }).appendTo(graphBuilder.getSVG());

    this.circle[0].node = this;

}

/** 
 * @private
 * @static
 */
GraphBuilderNode.id = 0;


/**
 * Returns the globally unique ID of this node
 * 
 * @returns {Number} this node's globally unique ID
 */
GraphBuilderNode.prototype.getId = function() {
    return this.id;
};

GraphBuilderNode.prototype.getLines = function() {
    return this.lines.slice();
};

GraphBuilderNode.prototype.getCircle = function() {
    return this.circle;
};

GraphBuilderNode.prototype.getCoords = function() {
    return [this.x, this.y];
};

GraphBuilderNode.prototype.addChild = function(n, l) {
    var line = new Line(this, n, l);
    this.children.push(n);
    this.lines.push(line);
    n.parents.push(this);
    n.lines.push(line);
    this.graphBuilder.invokeUpdateCallback();
};

GraphBuilderNode.prototype.removeChild = function(n) {
    Array.remove(this.children, n);
    Array.remove(n.parents, this);
};

GraphBuilderNode.prototype.getChildren = function() {
    return this.children.slice();
};


function Line(parent, child, line) {
    this.parent = parent;
    this.child = child;
    this.line = line;
}

Line.prototype.remove = function () {
    this.parent.removeChild(this.child);
    Array.remove(this.parent.lines, this);
    Array.remove(this.child.lines, this);
    this.line.remove();
};