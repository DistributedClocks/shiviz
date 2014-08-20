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
function GraphBuilderHost(graphBuilder, hostNum) {

    var host = this;

    /** @private */
    this.hostNum = hostNum;

    /** @private */
    this.graphBuilder = graphBuilder;

    /** @private */
    this.rx = hostNum * 65;

    /** @private */
    this.x = this.rx + 12.5;

    /** @private */
    this.color = graphBuilder.colors.pop();

    /** @private */
    this.nodes = [];

    /** @private */
    this.rect = Util.svgElement("rect").attr({
        "width": 25,
        "height": 25,
        "fill": this.color,
        "x": this.rx,
        "y": 0
    }).on("dblclick", function() {
        graphBuilder.removeHost(host);
    }).prependTo(graphBuilder.getSVG());

    /** @private */
    this.line = Util.svgElement("line").attr({
        "x1": this.x,
        "y1": 30,
        "x2": this.x,
        "y2": 500
    }).prependTo(graphBuilder.getSVG());
}

/**
 * Gets the name of this host that acts as an ID for this host.
 * 
 * @returns {String} the name of this host
 */
GraphBuilderHost.prototype.getName = function() {
    return String.fromCharCode(97 + this.hostNum);
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
 * @param y The y-coordinate of the node
 * @param tmp This does something albert should explain
 * @returns {GraphBuilderNode} the newly created and added node
 */
GraphBuilderHost.prototype.addNode = function(y, tmp) {

    var node = new GraphBuilderNode(this.graphBuilder, this.x, y, tmp, this.color);

    this.nodes.push(node);
    this.graphBuilder.invokeUpdateCallback();
    this.graphBuilder.bind();

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
    Array.remove(this.nodes, node);
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
