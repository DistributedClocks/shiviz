/**
 * Constructs a node with the provided x and y coordinates and color and is associated with
 * the provided {@link GraphBuilder}
 * 
 * @classdesc
 * 
 * A GraphBuilderNode is a node that is a component of a {@link GraphBuilder}.
 * 
 * @constructor
 * @param {GraphBuilder} graphBuilder The GraphBuilder
 * @param {Number} x The x-coordinate of the node
 * @param {Number} y The y-coordinate of the node
 * @param {Boolean} tmp Whether the node is temporary (i.e. result of incomplete action)
 * @param {String} color The color of the node
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

/**
 * Returns all {@link Line}s associated with the node
 * 
 * @returns {Array<Line>} The lines
 */
GraphBuilderNode.prototype.getLines = function() {
    return this.lines.slice();
};

/**
 * Returns the circle SVG element associated with the node
 * 
 * @returns {jQuery.selection} A jQuery selection of the circle
 */
GraphBuilderNode.prototype.getCircle = function() {
    return this.circle;
};

/**
 * Sets the radius of the circle SVG element associated with this node
 *
 * @param {Number} radius The new radius for the circle
 */
GraphBuilderNode.prototype.setCircleRadius = function(radius) {
    this.circle.attr("r", radius);
}

/**
 * Returns the coordinates as a two element array
 * 
 * @returns {Array<Number>} Array containing coordinates
 */
GraphBuilderNode.prototype.getCoords = function() {
    return [this.x, this.y];
};

/**
 * Adds a child to the node.
 * Creates the child relationship as well as the parent relationship
 * for the added node.
 * 
 * @param {GraphBuilderNode} n The node to add as child
 * @param {jQuery.selection} l The line SVG element between parent and child
 */
GraphBuilderNode.prototype.addChild = function(n, l) {
    var line = new Line(this, n, l);
    this.children.push(n);
    this.lines.push(line);
    n.parents.push(this);
    n.lines.push(line);
    this.graphBuilder.invokeUpdateCallback();
};

/**
 * Removes a child from the node.
 * 
 * @param  {GraphBuilderNode} n The node to remove
 */
GraphBuilderNode.prototype.removeChild = function(n) {
    Util.removeFromArray(this.children, n);
    Util.removeFromArray(n.parents, this);
};

/**
 * Returns the children of the node.
 * 
 * @returns {Array<GraphBuilderNode>} The children
 */
GraphBuilderNode.prototype.getChildren = function() {
    return this.children.slice();
};


/**
 * Constructs a line between two {@link GraphBuilderNode}s
 *
 * @classdesc
 *
 * A Line represents a parent-child relationship between two nodes.
 * 
 * @param {GraphBuilderNode} parent The parent node
 * @param {GraphBuilderNode} child The child node
 * @param {jQuery.selection} line A jQuery selection of the line connecting
 *            the two nodes
 */
function Line(parent, child, line) {
    this.parent = parent;
    this.child = child;
    this.line = line;
}

/**
 * Removes the parent-child connection
 */
Line.prototype.remove = function () {
    this.parent.removeChild(this.child);
    Util.removeFromArray(this.parent.lines, this);
    Util.removeFromArray(this.child.lines, this);
    this.line.remove();
};