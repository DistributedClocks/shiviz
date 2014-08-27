/**
 * Constructs a HideHostTransformation where no host is specified to be hidden
 * 
 * @classdesc
 * 
 * <p>
 * This transformation generates a transformed model by removing this
 * Transformation's hostToHide from the provided model. It removes all nodes for
 * the hostToHide and any edges touching a node for the hostToHide and adds
 * transitive edges. The added transitive edges will be drawn with dashed lines.
 * </p>
 * 
 * <p>
 * If this transformation is applied to a graph that doesn't have the specified
 * host, then this transformation does nothing
 * </p>
 * 
 * @constructor
 * @param {String} host The host to hide from the model
 */
function HideHostTransformation(host) {
    /** @private */
    this.host = host;
}

// HideHostTransformation extends Transformation
HideHostTransformation.prototype = Object.create(Transformation.prototype);
HideHostTransformation.prototype.constructor = HideHostTransformation;

/**
 * Returns the host that is hidden
 * 
 * @returns {String} The host
 */
HideHostTransformation.prototype.getHost = function() {
    return this.host;
};

/**
 * Performs the transformation on the given VisualGraph. The VisualGraph and its
 * underlying Graph are modified in place
 * 
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
HideHostTransformation.prototype.transform = function(model) {
    var graph = model.getGraph();
    
    if(graph.getHead(this.host) == null) {
        return;
    }
    
    var curr = graph.getHead(this.host).getNext();
    var parents = [];
    var children = [];

    while (!curr.isTail()) {
        model.addHiddenEdgeToFamily(curr);

        if (curr.hasParents() || curr.getNext().isTail()) {
            for (var i = 0; i < parents.length; i++) {
                for (var j = 0; j < children.length; j++) {
                    if (parents[i].getHost() != children[j].getHost()) {
                        parents[i].addChild(children[j]);

                        model.getVisualEdgeByNodes(parents[i], children[j]).setDashLength(5);
                    }
                }
            }

            if (children.length > 0) {
                children = [];
                parents = [];
            }

            parents = parents.concat(curr.getParents());
        }

        if (curr.hasChildren()) {
            children = children.concat(curr.getChildren());
        }

        curr = curr.getNext();
    }

    graph.removeHost(this.host);
    model.update();
};
