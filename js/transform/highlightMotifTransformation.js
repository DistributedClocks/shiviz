/**
 * @class
 * 
 * This transformation visually highlights a set of motifs.
 * 
 * @constructor
 * @extends Transformation
 * @param {MotifFinder} finder A MotifFinder that specifies which motif to
 *            highlight
 * @param {Boolean} ignoreEdges If true, edges will not be visually highlighted
 */
function HighlightMotifTransformation(finder, ignoreEdges) {

    /** @private */
    this.finder = finder;
    
    this.highlighted = null;

    this.setIgnoreEdges(ignoreEdges);
}

// HighlightMotifTransformation extends Transformation
HighlightMotifTransformation.prototype = Object.create(Transformation.prototype);
HighlightMotifTransformation.prototype.constructor = HighlightMotifTransformation;

/**
 * Sets whether or not to highlight edges that are part of the motif.
 * 
 * @param {Boolean} val If true, edges will not be visually highlighted
 */
HighlightMotifTransformation.prototype.setIgnoreEdges = function(val) {
    this.ignoreEdges = !!val;
};

HighlightMotifTransformation.prototype.getHighlighted = function() {
    return this.highlighted;
};

/**
 * Overrides {@link Transformation#transform}
 */
HighlightMotifTransformation.prototype.transform = function(model) {
    var motifGroup = this.finder.find(model.getGraph());

    model.getVisualNodes().forEach(function(node) {
        node.setOpacity(0.2);
    });
    model.getVisualEdges().forEach(function(edge) {
        edge.setOpacity(0.2);
    });

    var nodes = motifGroup.getNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var visualNode = model.getVisualNodeByNode(node);
        visualNode.setRadius(visualNode.getRadius() * 1.2);
        visualNode.setOpacity(1);
    }

    var edges = motifGroup.getEdges();
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        var visualEdge = model.getVisualEdgeByNodes(edge[0], edge[1]);
        visualEdge.setColor("#333");
        visualEdge.setOpacity(1);
        // visualEdge.setWidth(visualEdge.getWidth() * 1.5);
    }
    
    this.highlighted = motifGroup;
};
