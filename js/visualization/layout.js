/**
 * The constructor for this abstract class may be invoked by sub-classes
 * 
 * @classdesc
 * 
 * A Layout is responsible for positioning the {@link VisualNode}s of a
 * {@link VisualGraph} (i.e by setting their x and y coordinates).
 * 
 * @constructor
 * @abstract
 */
function Layout() {

    if (this.constructor == Layout) {
        throw new Exception("Cannot instantiate Layout; Layout is an abstract class");
    }

}

/**
 * This method is solely responsible for actually performing the layout (i.e by
 * manipulating the x and y coordinates of {@link VisualNode}s in the
 * {@link VisualGraph}.
 * 
 * @abstract
 */
Layout.prototype.start = function() {

};

/**
 * @classdesc
 * 
 * SpaceTimeLayout arranges a {@link VisualGraph} as a space-time diagram with
 * hosts laid out horizontally and time increasing with y coordinate.
 * 
 * @constructor
 * @extends Layout
 * @param {Number} width The maximum width of the resulting layout
 * @param {Number} delta The vertical distance between nodes
 */
function SpaceTimeLayout(width, delta) {

    /** @private */
    this.width = width;

    /** @private */
    this.delta = delta;

    /** @private */
    this.height = 0;
}

// SpaceTimeLayout extends Layout
SpaceTimeLayout.prototype = Object.create(Layout.prototype);
SpaceTimeLayout.prototype.constructor = SpaceTimeLayout;

/**
 * This method is solely responsible for actually performing the layout (i.e by
 * manipulating the x and y coordinates of {@link VisualNode}s in the
 * {@link VisualGraph}. A topological sort is performed to ensure that the
 * y-coordinate of any VisualNode's Node is greater than that of its prev and
 * parent nodes
 * 
 * @param {VisualGraph} visualGraph The visualGraph to lay out
 * @param {HostPermutation} hostPermutation
 */
SpaceTimeLayout.prototype.start = function(visualGraph, hostPermutation) {

    this.height = 0;

    var nodeToNumParents = {};
    var nodeToChildren = {};

    var nodes = visualGraph.getVisualNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.setY(0);
        nodeToNumParents[node.getId()] = 0;
        nodeToChildren[node.getId()] = [];
    }

    var edges = visualGraph.getVisualEdges();
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        var source = edge.getSourceVisualNode();
        var target = edge.getTargetVisualNode();
        nodeToNumParents[target.getId()]++;
        nodeToChildren[source.getId()].push(target);
    }

    var noParents = [];
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (nodeToNumParents[node.getId()] == 0) {
            noParents.push(node);
        }
    }

    var hosts = hostPermutation.getHostsAndFilter(visualGraph.getHosts());
    var hostNameToIndex = {};
    for (var i = 0; i < hosts.length; i++) {
        hostNameToIndex[hosts[i]] = i;
    }

    
     var widthPerHost = Math.max(this.width / hosts.length, Global.MIN_HOST_WIDTH);
    var leftMargin = widthPerHost / 2;

    while (noParents.length > 0) {
        var current = noParents.pop();

        this.height = Math.max(this.height, current.getY());
        current.setX(widthPerHost * hostNameToIndex[current.getHost()] + leftMargin);

        var children = nodeToChildren[current.getId()];
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            nodeToNumParents[child.getId()]--;
            if (nodeToNumParents[child.getId()] == 0) {
                noParents.push(child);
            }
            child.setY(Math.max(child.getY(), current.getY() + this.delta));
        }
    }

    this.height += this.delta;
    
    visualGraph.getVisualEdges().forEach(function(visualEdge) {
        visualEdge.updateCoords();
    });

};

/**
 * Gets the height of the resulting layout
 * 
 * @returns {Number} The height
 */
SpaceTimeLayout.prototype.getHeight = function() {
    return this.height;
};

/**
 * Gets the width of the resulting layout
 * 
 * @returns {Number} The width
 */
SpaceTimeLayout.prototype.getWidth = function() {
    return this.width;
};

/**
 * Sets the width of the resulting layout
 * 
 * @params {Number} width The width
 */
SpaceTimeLayout.prototype.setWidth = function(width) {
    this.width = width;
};