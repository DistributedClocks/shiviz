/**
 * @class
 * 
 * A VisualNode represents the visualization of a Node that is, this class
 * describes how the Node should be drawn (such as its size, color, etc). Note
 * that the actual drawing logic is not part of this class.
 * 
 * @param {Node} node The Node to associate with this VisualNode. This object
 *        will then be a visualization of the argument
 * @constructor
 */
function VisualNode(node) {
    /** @private */
    this.id = VisualNode.id++;

    /** @private */
    this.node = node;

    /** @private */
    this.x = 0;

    /** @private */
    this.y = 0;

    /** @private */
    this.radius = 5;

    /** @private */
    this.fillColor = 0;

    /** @private */
    this.label = "";
}

// Global variable used to assign each node an unique id
VisualNode.id = 0;

/**
 * Gets this VisualNode's globally unique ID
 * 
 * @returns {Number} The unique ID
 */
VisualNode.prototype.getId = function() {
    return this.id;
};

/**
 * Gets the underlying Node that this VisualNode is a visualization of
 * 
 * @returns {Node} The underlying node
 */
VisualNode.prototype.getNode = function() {
    return this.node;
};

/**
 * Gets the x coordinate of the center of the VisualNode.
 * 
 * @returns {Number} The x-coordinate
 */
VisualNode.prototype.getX = function() {
    return this.x;
};

/**
 * Sets the x coordinate of the center of the drawing of VisualNode.
 * 
 * @param {Number} newX The new x-coordinate
 */
VisualNode.prototype.setX = function(newX) {
    this.x = newX;
};

/**
 * Gets the y coordinate of the center of the VisualNode.
 * 
 * @returns {Number} The y-coordinate
 * 
 */
VisualNode.prototype.getY = function() {
    return this.y;
};

/**
 * Sets the y coordinate of the center of the VisualNode.
 * 
 * @param {Number} newY The new y-coordinate
 */
VisualNode.prototype.setY = function(newY) {
    this.y = newY;
};

/**
 * Gets the radius of the VisualNode
 * 
 * @returns {Number} The radius
 */
VisualNode.prototype.getRadius = function() {
    return this.radius;
};

/**
 * Sets the radius of the VisualNode
 * 
 * @param {Number} newRadius The new radius
 */
VisualNode.prototype.setRadius = function(newRadius) {
    this.radius = newRadius;
};

/**
 * Gets the fill color of the VisualNode in standard RGB-form.
 * 
 * @returns {Number} The fill color
 */
VisualNode.prototype.getFillColor = function() {
    return this.fillColor;
};

/**
 * Sets the fill color of the VisualNode
 * 
 * @param {Number} newFillColor The new fill color
 */
VisualNode.prototype.setFillColor = function(newFillColor) {
    this.fillColor = newFillColor;
};

/**
 * Gets the texual description of the VisualNode.
 * 
 * @returns {String} The text
 */
VisualNode.prototype.getText = function() {
    if (this.isStart()) {
        return this.getHost();
    }
    return this.node.getLogEvents()[0].getText();
};

/**
 * Gets the VisualNode's label text. The label text is displayed inside the
 * VisualNode itself
 * 
 * @returns {String} The label text
 */
VisualNode.prototype.getLabel = function() {
    return this.label;
};

/**
 * Sets the VisualNode's label text. The label text is displayed inside the
 * VisualNode itself
 * 
 * @param {String} newLabel The new label text
 */
VisualNode.prototype.setLabel = function(newLabel) {
    this.label = newLabel;
};

/**
 * Gets the VisualNode's host. This will be the same as the host of the
 * underlying node.
 * 
 * @returns {String} The host
 */
VisualNode.prototype.getHost = function() {
    return this.node.getHost();
};

/**
 * Gets the line number in the original log text associated with this VisualNode
 * 
 * @returns {Number} The line number
 */
VisualNode.prototype.getLineNumber = function() {
    return this.node.getLogEvents()[0].getLineNumber(); // Todo: temporary
};

/**
 * Determines if this VisualNode is the special starting node of its host. The
 * start node will be drawn differently from non-start nodes.
 * 
 * @returns {boolean} True if this is a start VisualNode
 */
VisualNode.prototype.isStart = function() {
    return this.node.isHead();
};
