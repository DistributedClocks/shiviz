/**
 * Constructs a VisualNode given a {@link ModelNode}. The newly constructed
 * VisualNode will represent the visualization of the {@link ModelNode}.
 * 
 * @classdesc
 * 
 * A VisualNode represents the visualization of an {@link ModelNode} that is,
 * this class describes how the Node should be drawn (such as its size, color,
 * etc). Note that the actual drawing logic is not part of this class.
 * 
 * @constructor
 * @param {ModelNode} node The node to associate with this VisualNode. This
 *            object will then be a visualization of the argument
 */
function VisualNode(node) {
    
    /** @private */
    this.id = VisualNode.id++;

    /** @private */
    this.node = node;
    
    /** @private */
    this.$svg = Util.svgElement("g");
    
    this.$title = $("<title></title>");
    
    this.$circle = Util.svgElement("circle");
    
    this.$text = Util.svgElement("text");
    
    this.$hiddenParentLine = Util.svgElement("line");
    
    this.$hiddenChildLine = Util.svgElement("line");

    this.$rect = Util.svgElement("rect");
	
    this.$diamond = Util.svgElement("polygon");
    
    this.$highlightRect = Util.svgElement("rect");

    /** @private */
    this.x = 0;

    /** @private */
    this.y = 0;
    
    this.setX(0);
    this.setY(0);

    /** @private */
    this.radius = 0;
    this.setRadius(5);
	
    /** @private */
    this.points = [0,0,0,0,0,0,0,0];

    /** @private */
    this.fillColor;
    this.setFillColor("#000");

    /** @private */
    this.strokeColor;
    this.setStrokeColor("#fff");

    /** @private */
    this.strokeWidth;
    this.setStrokeWidth(2);

    /** @private */
    this.opacity;
    this.setOpacity(1);

    /** @private */
    this.label = "";
    this.setLabel("");

    /** @private */
    this.hasHiddenParentInner = false;

    /** @private */
    this.hasHiddenChildInner = false;
	
    /** @private */
    this._isHighlighted = false;

    /** @private */
    this._isSelected = false;

    if (this.isStart()) {
        this.$rect.attr({
            "width": Global.HOST_SIZE,
            "height": Global.HOST_SIZE
        });
        this.$svg.append(this.$rect);
        this.$highlightRect.attr({
            "fill": "transparent",
            "stroke": "#FFF",
            "stroke-width": "2px",
            "pointer-events": "none"
        });
    } else {
        this.$title.text(this.getText());
        this.$svg.append(this.$title);

        var mouseOverRect = Util.svgElement("rect");
        mouseOverRect.attr({
            "width": 48,
            "height": 48,
            "x": -24,
            "y": -24
        });
        this.$svg.append(mouseOverRect);

        this.$svg.append(this.$circle);

        this.$svg.attr("id", "node" + this.getId());

        this.$hiddenParentLine.attr({
            "class": "hidden-link",
            "x1": 0,
            "y1": 0
        });

        this.$hiddenChildLine.attr({
            "class": "hidden-link",
            "x1": 0,
            "y1": 0
        });
    }
}

/**
 * Global variable used to assign each node an unique id
 * 
 * @private
 * @static
 */
VisualNode.id = 0;

VisualNode.prototype.getSVG = function() {
    return this.$svg;
};

/**
 * Gets this VisualNode's globally unique ID
 * 
 * @returns {Number} The unique ID
 */
VisualNode.prototype.getId = function() {
    return this.id;
};

/**
 * Gets the underlying {@link ModelNode} that this VisualNode is a visualization
 * of
 * 
 * @returns {ModelNode} The underlying node
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
    var translateX = this.isStart() ? newX - (Global.HOST_SIZE / 2) : newX;
    this.x = newX;
    this.$svg.attr("transform", "translate(" + translateX + "," + this.getY() + ")");
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
    this.$svg.attr("transform", "translate(" + this.getX() + "," + newY + ")");
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
    this.$circle.attr("r", newRadius);
    
    if(this.hasHiddenParent()) {
        this.$hiddenParentLine.attr({
            "x2": Global.HIDDEN_EDGE_LENGTH + newRadius,
            "y2": -(Global.HIDDEN_EDGE_LENGTH + newRadius)
        });
    }
    
    if(this.hasHiddenChild()) {
        this.$hiddenChildLine.attr({
            "x2": Global.HIDDEN_EDGE_LENGTH + newRadius,
            "y2": Global.HIDDEN_EDGE_LENGTH + newRadius
        });
    }
};

/**
 * Gets the polygon points of a unique VisualNode
 * 
 * @returns {Array.<Number>} The polygon points
 */
VisualNode.prototype.getPoints = function() {
    return this.points;
};

/**
 * Sets the polygon points of a unique VisualNode
 * 
 * @param {Number} x, the new non-zero x coordinates (see updateNodeShape method)
 * @param {Number} y, the new non-zero y coordinates
 */
VisualNode.prototype.setPoints = function(x,y) {
    this.updateNodeShape(x,y);
    
    if(this.hasHiddenParent()) {
        this.$hiddenParentLine.attr({
            "x2": Global.HIDDEN_EDGE_LENGTH + x,
            "y2": -(Global.HIDDEN_EDGE_LENGTH + y)
        });
    }
    
    if(this.hasHiddenChild()) {
        this.$hiddenChildLine.attr({
            "x2": Global.HIDDEN_EDGE_LENGTH + x,
            "y2": Global.HIDDEN_EDGE_LENGTH + y
        });
    }
};

/**
 * Gets the fill color of the VisualNode.
 * 
 * @returns {String} The fill color
 */
VisualNode.prototype.getFillColor = function() {
    return this.fillColor;
};

/**
 * Sets the fill color of the VisualNode.
 * 
 * @param {String} newFillColor The new fill color. The color must be a string
 *            that parses to a valid SVG color as defined in
 *            http://www.w3.org/TR/SVG/types.html#WSP
 */
VisualNode.prototype.setFillColor = function(newFillColor) {
    this.fillColor = newFillColor;
    this.$circle.attr("fill", newFillColor);
    this.$rect.attr("fill", newFillColor);
    this.$diamond.attr("fill", newFillColor);
};

/**
 * Gets the stroke color of the VisualNode.
 * 
 * @returns {String} The fill color
 */
VisualNode.prototype.getStrokeColor = function() {
    return this.strokeColor;
};

/**
 * Sets the stroke color of the VisualNode.
 * 
 * @param {String} newStrokeColor The new stroke color. The color must be a
 *            string that parses to a valid SVG color as defined in
 *            http://www.w3.org/TR/SVG/types.html#WSP
 */
VisualNode.prototype.setStrokeColor = function(newStrokeColor) {
    this.strokeColor = newStrokeColor;
    this.$circle.attr("stroke", newStrokeColor);
    this.$rect.attr("stroke", newStrokeColor);
    this.$diamond.attr("stroke", newStrokeColor);
};

/**
 * Sets the stroke width in px
 * 
 * @param {Number} newStrokeWidth The new stroke width in units of px
 */
VisualNode.prototype.setStrokeWidth = function(newStrokeWidth) {
    this.strokeWidth = newStrokeWidth;
    this.$circle.attr("stroke-width", newStrokeWidth + "px");
    this.$rect.attr("stroke-width", newStrokeWidth + "px");
    this.$diamond.attr("stroke-wdith", newStrokeWidth + "px");
};

/**
 * Gets the stroke width in units of px
 * 
 * @returns {Number} The stroke width in units of px
 */
VisualNode.prototype.getStrokeWidth = function() {
    return this.strokeWidth;
};

/**
 * Gets the opacity of the node
 * 
 * @returns {Number} The opacity
 */
VisualNode.prototype.getOpacity = function() {
    return this.opacity;
};

/**
 * Sets the opacity
 * 
 * @param {Number} opacity The opacity
 */
VisualNode.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
    this.$circle.attr("opacity", opacity);
    this.$diamond.attr("opacity", opacity);
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
    newLabel += "";
    if(this.label.trim() == "" && newLabel.trim() != "") {
        this.$svg.append(this.$text);
    }
    if(this.label.trim() != "" && newLabel.trim() == "") {
        this.$text.remove();
    }
    this.label = newLabel;
    this.$text.text(newLabel);
};

/**
 * Gets the texual description of the VisualNode.
 * 
 * @returns {String} The text
 */
VisualNode.prototype.getText = function() {
    if (this.isStart())
        return this.getHost();
    else if (!this.isCollapsed())
        return this.node.getFirstLogEvent().getText();
    else
        return this.node.getLogEvents().length + " collapsed events";
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
    return this.node.getFirstLogEvent().getLineNumber();
};

/**
 * Determines if this VisualNode is the special starting node of its host. The
 * start node will be drawn differently from non-start nodes.
 * 
 * @returns {Boolean} True if this is a start VisualNode
 */
VisualNode.prototype.isStart = function() {
    return this.node.isHead();
};

/**
 * Determines if this should be drawn with an edge to a hidden parent.
 * 
 * @returns {Boolean} True if edge should be drawn
 */
VisualNode.prototype.hasHiddenParent = function() {
    return this.hasHiddenParentInner;
};

/**
 * Sets if this should be drawn with an edge to a hidden parent.
 * 
 * @param {Boolean} val True if edge should be drawn
 */
VisualNode.prototype.setHasHiddenParent = function(val) {
    if(this.hasHiddenParentInner && !val) {
        this.$hiddenParentLine.remove();
    }
    else if(!this.hasHiddenParentInner && val) {
        this.$hiddenParentLine.attr({
            "x2": Global.HIDDEN_EDGE_LENGTH + this.getRadius(),
            "y2": -(Global.HIDDEN_EDGE_LENGTH + this.getRadius())
        });
        this.$svg.append(this.$hiddenParentLine);
    }
    this.hasHiddenParentInner = val;
};

/**
 * Determines if this should be drawn with an edge to a hidden child.
 * 
 * @returns {Boolean} True if edge should be drawn
 */
VisualNode.prototype.hasHiddenChild = function() {
    return this.hasHiddenChildInner;
};

/**
 * Sets if this should be drawn with an edge to a hidden child.
 * 
 * @param {Boolean} val True if edge should be drawn
 */
VisualNode.prototype.setHasHiddenChild = function(val) {
    if(this.hasHiddenChildInner && !val) {
        this.$hiddenChildLine.remove();
    }
    else if(!this.hasHiddenChildInner && val) {
        this.$hiddenChildLine.attr({
            "x2": Global.HIDDEN_EDGE_LENGTH + this.getRadius(),
            "y2": Global.HIDDEN_EDGE_LENGTH + this.getRadius()
        });
        this.$svg.append(this.$hiddenChildLine);
    }
    this.hasHiddenChildInner = val;
};

/**
 * Determines if this VisualNode is a collapsed set of single nodes.
 * 
 * @returns {Boolean} True if this is a collapsed node.
 */
VisualNode.prototype.isCollapsed = function() {
    return this.node.getLogEvents().length > 1;
};

/**
 * Determines if this VisualNode is highlighted.
 * 
 * @returns {Boolean} True if this node is highlighted
 */
VisualNode.prototype.isHighlighted = function() {
    return this._isHighlighted;
};


/**
 * Sets if this VisualNode is highlighted.
 * 
 * @param {Boolean} val True if this node is highlighted
 */
VisualNode.prototype.setHighlight = function(val) {
    if(this._isHighlighted && !val) {
        this.$highlightRect.remove();
    }
    else {
        this.$highlightRect.attr({
            "width": "15px",
            "height": "15px",
            "x": "5px",
            "y": "5px"
        });
        this.$svg.append(this.$highlightRect);
    }
    
    this._isHighlighted = val;

};

/**
 * Returns whether the node is selected
 * 
 * @returns {Boolean} True if the node is selected
 */
VisualNode.prototype.isSelected = function() {
    return this._isSelected;
};

/**
 * Sets if the node is selected
 * 
 * @param {Boolean} val True if the node is selected
 */
VisualNode.prototype.setSelected = function(val) {
    this._isSelected = val;
};

/**
 * Update the shape of the unique head node to a diamond shape
 * (unique meaning it only shows up in one of the two active views)
 */

VisualNode.prototype.drawHostAsRhombus = function() {
    this.points = [12,0,22,12,12,24,2,12];
    this.$diamond.attr({
      "width": Global.HOST_SIZE,
      "height": Global.HOST_SIZE,
      "points": this.points.join()
     });
     this.$rect.remove();
     this.$svg.append(this.$diamond);
};

/**
 * Update the shape of the unique non-start node to a diamond shape
 * (unique meaning it only shows up in one of the two active views)
 */

VisualNode.prototype.drawEventAsRhombus = function(x,y) {
    this.points = [0,-y,x,0,0,y,-x,0];
    this.$diamond.attr("points", this.points.join());
    this.$circle.remove();
    this.$svg.append(this.$diamond);
    this.$svg.append(this.$text);
};