
/**
 * Constructs a {@link GraphBuilder} host with the provided number associated
 * with the provided graph builder.
 * 
 * @classdesc
 * 
 * GraphBuilderHost represents a host in a {@link GraphBuilder}. This class
 * contains methods to access and modify the nodes contained in this host.
 * 
 * @constructor
 * @param {GraphBuilder} graphBuilder
 * @param {Number} hostNum The host number. The graph builder host with hostNum =
 *            i should be the ith host in the graphBuilder.
 */
function GraphBuilderHost(graphBuilder, hostNum, motifSearch) {

    var host = this;

    /** @private */
    this.hostNum = hostNum;

    /** @private */
    this.graphBuilder = graphBuilder;

    /** @private */
    this.rx = (motifSearch ? hostNum * 40 : hostNum * 65);

    /** @private */
    this.x = (motifSearch ? this.rx + 10 : this.rx + 12.5);

    /** @private */
    this.color = graphBuilder.colors.pop();

    /** @private */
    this.motifSearch = motifSearch;

    /** @private */
    this.nodes = [];

    /** @private */
    this.constraint = "";

    /** @private */
    this.rect = Util.svgElement("rect").attr({
        "width": 25,
        "height": 25,
        "fill": this.color,
        "x": this.rx,
        "y": 0
    })

    if (!motifSearch) {
        graphBuilder.bindHost(this);
        this.rect.prependTo(graphBuilder.getSVG());
    }

    /** @private */
    this.line = Util.svgElement("line").attr({
        "x1": this.x,
        "y1": 30,
        "x2": this.x,
        "y2": 1000
    }).prependTo(graphBuilder.getSVG());
}

/**
 * Gets the name of this host that acts as an ID for this host.
 * 
 * @returns {String} the name of this host
 */
GraphBuilderHost.prototype.getName = function() {
    var constraint = this.getConstraint();

    if (constraint) {
        return constraint;
    } else {
        return String.fromCharCode(97 + this.hostNum);
    }
};

/**
 * Gets the nodes this host contains as an array.
 * 
 * @returns {Array<GraphBuilderNode>} the nodes as an array
 */
GraphBuilderHost.prototype.getNodes = function() {
    return this.nodes.slice();
};

/**
 * Gets the nodes this host contains as an array sorted by the nodes' y values
 * in ascending order
 * 
 * @returns {Array<GraphBuilderNode>} the nodes as a sorted array
 */
GraphBuilderHost.prototype.getNodesSorted = function() {
    return this.getNodes().sort(function(a, b) {
        return a.y - b.y;
    });
};

/**
 * Creates a GraphBuilderNode and adds it to this host.
 * 
 * @param {Number} y The y-coordinate of the node
 * @param {Boolean} tmp Whether the created node is temporary (i.e. user
 *            has not yet completed drawing action)
 * @returns {GraphBuilderNode} the newly created and added node
 */
GraphBuilderHost.prototype.addNode = function(y, tmp) {

    var node = new GraphBuilderNode(this.graphBuilder, this.x, y, tmp, this.color);
    if (this.motifSearch) {
        node.setCircleRadius(3);
    }

    this.nodes.push(node);
    this.graphBuilder.invokeUpdateCallback();
    // Don't bind any mouse events to motif drawings in the sidebar
    if (!this.motifSearch) {
        this.graphBuilder.bindNodes();
    }

    return node;
};

/**
 * Removes the provided node from this host
 * 
 * @param {GraphBuilderNode} node the node to remove
 */
GraphBuilderHost.prototype.removeNode = function(node) {
    node.getLines().forEach(function(l) {
        l.remove();
    });
    Util.removeFromArray(this.nodes, node);
    node.getCircle().remove();
    this.graphBuilder.invokeUpdateCallback();
};

/**
 * Removes all nodes from this host
 */
GraphBuilderHost.prototype.removeAllNodes = function() {
    while (this.nodes.length > 0)
        this.removeNode(this.nodes[0]);
    this.nodes = [];
};

/**
 * Gets this hosts' own color
 * 
 * @returns {String} The color
 */
GraphBuilderHost.prototype.getColor = function() {
    return this.color;
};

/**
 * Gets the rectangle SVG associated with this graphBuilderHost
 *
 * @returns {svg.Element} The rectangle svg
 */
GraphBuilderHost.prototype.getHostSquare = function() {
    return this.rect;
}

/**
 * Gets the rectangle SVG associated with this graphBuilderHost
 *
 * @returns {svg.Element} The rectangle svg
 */
GraphBuilderHost.prototype.getX = function() {
    return this.x;
}

/**
 * Updates the host number associated with this graphBuilderHost
 *
 * @param {Number} hostNum
 */
GraphBuilderHost.prototype.setHostNum = function(hostNum) {
    this.hostNum = hostNum;
}

/**
 * Gets the host number associated with this graphBuilderHost
 *
 * @returns {Number}
 */
GraphBuilderHost.prototype.getHostNum = function() {
    return this.hostNum;
}

/**
 * Sets the constraint associated with this graphBuilderHost
 *
 * @param {} constraint
 */
GraphBuilderHost.prototype.setConstraint = function(constraint) {
    this.constraint = constraint;
}

/**
 * Gets the constraint associated with this graphBuilderHost
 *
 * @returns {}
 */
GraphBuilderHost.prototype.getConstraint = function() {
    return this.constraint;
}

/**
 * Sets the y coordinates for the line segment of this host
 *
 * @param {Number} y1 The top coordinate for the line
 * @param {Number} y2 The bottom coordinate for the line
 */
GraphBuilderHost.prototype.setLineYCoordinates = function(y1, y2) {
    this.line.attr("y1", y1);
    this.line.attr("y2", y2);
}