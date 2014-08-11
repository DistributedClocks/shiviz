/**
 * Constructs a Transformer for a particular {@link View}
 * 
 * @classdesc
 * 
 * Transformer keeps track of transformations to be applied to a specific
 * VisualGraph and takes care of transforming the model.
 * 
 * @constructor
 */
function Transformer() {

    /** @private */
    this.transformations = [];

    this.hostToHidingTransform = {};

    this.collapseSequentialNodesTransformation = new CollapseSequentialNodesTransformation(2);

    this.highlightHostTransformation = new HighlightHostTransformation();

    this.highlightHostToIndex = {};

}

Transformer.prototype.hideHost = function(host) {
    if (this.hostToHidingTransform[host]) {
        return;
    }
    var trans = new HideHostTransformation(host);
    this.hostToHidingTransform[host] = trans;
    this.transformations.push(trans);
};

Transformer.prototype.unhideHost = function(host) {
    var trans = this.hostToHidingTransform[host];
    if (trans) {
        var index = this.transformations.indexOf(trans);
        this.transformations.splice(index, 1);
        delete this.hostToHidingTransform[host];
    }
    else if (this.highlightHostTransformation.isHidden(host)) {
        this.highlightHostTransformation.clearHosts();
    }
};

Transformer.prototype.highlightHost = function(host) {
    this.highlightHostTransformation.addHost(host);
    this.highlightHostToIndex[host] = this.transformations.length;
};

Transformer.prototype.unhighlighHost = function(host) {
    this.highlightHostTransformation.removeHost(host);
    delete this.highlightHostToIndex[host];
};

Transformer.prototype.toggleHighlightHost = function(host) {
    if (this.highlightHostTransformation.isHighlighted(host)) {
        this.unhighlighHost(host);
    }
    else {
        this.highlightHost(host);
    }
};

Transformer.prototype.collapseNode = function(node) {
    this.collapseSequentialNodesTransformation.removeExemption(node);
};

Transformer.prototype.uncollapseNode = function(node) {
    this.collapseSequentialNodesTransformation.addExemption(node);
};

Transformer.prototype.toggleCollapseNode = function(node) {
    this.collapseSequentialNodesTransformation.toggleExemption(node);
};

Transformer.prototype.getHiddenHosts = function() {
    return Object.keys(this.hostToHidingTransform).concat(this.highlightHostTransformation.getHiddenHosts());
};

/**
 * <p>
 * Transforms the model.
 * </p>
 * <p>
 * The transformations are applied in the order in which they were added, with
 * exceptions.
 * </p>
 * 
 * <p>
 * Exceptions:
 * </p>
 * <ul>
 * <li>HighlightHostTransformations are gathered into the last instance, at
 * which they are then applied all at once.</li>
 * </ul>
 */
Transformer.prototype.transform = function(visualModel) {
    this.collapseSequentialNodesTransformation.transform(visualModel);
    
    var maxIndex = 0;
    for(var key in this.highlightHostToIndex) {
        maxIndex = Math.max(maxIndex, this.highlightHostToIndex[key]);
    }

    for (var i = 0; i < maxIndex; i++) {
        var trans = this.transformations[i];
        trans.transform(visualModel);
    }

    this.highlightHostTransformation.transform(visualModel);
    
    for (var i = maxIndex; i < this.transformations.length; i++) {
        var trans = this.transformations[i];
        trans.transform(visualModel);
    }
};