/**
 * Constructs a Transformer
 * 
 * @classdesc
 * 
 * <p>
 * A Transformer is responsible for transforming a {@link VisualGraph} and the
 * underlying {@link ModelGraph}. Transformer exposes methods such as
 * {@link Transformer#hideHost} that allow other classes to specify how this
 * transformer should transform graphs. Internally, it manages a bunch of
 * {@link Transformation}s to achieve the desired effect.
 * </p>
 * 
 * <p>
 * Shiviz {@link Transformation}s can interact with each other in complex ways.
 * For this reason, Transformer does not expose Transformations to outside
 * classes, but instead acts as a black box that can be used to transform graphs
 * </p>
 * 
 * <p>
 * Typical usage for this class involves invoking methods such as
 * {@link Transformer#collapseNode} to specifiy how the graph should be
 * transformed and then invoking the {@link Transformer#transform} method. Note
 * that no graphs or visual graphs are actually modified until the transform
 * method is called.
 * </p>
 * 
 * @constructor
 */
function Transformer() {

    /** @private */
    this.transformations = [];

    /** @private */
    this.hostToHidingTransform = {};
	
    /** @private */
    this.viewToDiffTransform = {};

    /** @private */
    this.collapseSequentialNodesTransformation = new CollapseSequentialNodesTransformation(2);

    /** @private */
    this.highlightHostTransformation = new HighlightHostTransformation();

    /** @private */
    this.highlightHostToIndex = {};

    /** @private */
    this.highlightMotifTransformation = null;

    /** @private */
    this.hiddenHosts = [];
	
    /** @private */
    this.uniqueHosts = [];
	
    /** @private */
    this.uniqueEvents = [];

    /** @private */
    this.highlighted = null;

}

/**
 * Sets this transformer to hide the specified host. If the specified host is
 * already set to be hidden, this method does nothing.
 * 
 * @param {String} host The host that is to be hidden
 * @see {@link HideHostTransformation}
 */
Transformer.prototype.hideHost = function(host) {
    if (this.hostToHidingTransform[host]) {
        return;
    }
    var trans = new HideHostTransformation(host);
    this.hostToHidingTransform[host] = trans;
    this.transformations.push(trans);
};

/**
 * <p>
 * Unsets this transformer to hide the specified host. If the specified host is
 * not currently set to be hidden, this method does nothing.
 * </p>
 * 
 * <p>
 * A host could've been hidden either explicitly with a call to
 * {@link Transformer#hideHost} or implicitly when a host is highlighted. In the
 * latter case, all highlighted nodes will be unhighlighted as well.
 * </p>
 * 
 * @param {String} host The host that is no longer to be hidden
 * @see {@link HideHostTransformation}
 */
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

/**
 * Gets the hosts that are explicitly specified to be hidden. Note that a hosts
 * that doesn't actually exist can be specified to be hidden. In addition, there
 * are hosts that may be implicitly hidden by other transformations. These two
 * facts mean that the returned list of hosts may be different from the hosts
 * that are actually hidden.
 * 
 * @returns {Array<String>} the hosts specified to be hidden
 * @see {@link HideHostTransformation}
 */
Transformer.prototype.getSpecifiedHiddenHosts = function() {
    return Object.keys(this.hostToHidingTransform);
};

/**
 * Get all of the hosts hidden by this transformer by the last invocation of
 * {@link Transformer#transform}. If the transform method has never been
 * called, this method returns an empty array.
 * 
 * @returns {Array<String>} the hosts that have been hidden by this
 *          transformer.
 */
Transformer.prototype.getHiddenHosts = function() {
    return this.hiddenHosts.slice();
};

/**
 * Get all of the unique hosts hidden by this transformer by the last invocation of
 * {@link Transformer#transform}. If the transform method has never been
 * called, this method returns an empty array.
 * 
 * @returns {Array<String>} the unique hosts that have been hidden by this
 *          transformer.
 */
Transformer.prototype.getUniqueHosts = function() {
    return this.uniqueHosts.slice();
};

/**
 * Get all of the unique events transformed by this transformer by the last invocation of
 * {@link Transformer#transform}. If the transform method has never been
 * called, this method returns an empty array.
 * 
 * @returns {Array<String>} the unique events that have been transformed by this
 *          transformer.
 */
Transformer.prototype.getUniqueEvents = function() {
    return this.uniqueEvents.slice();
};

/**
 * Sets this transformer to highlight the specified host.
 * 
 * @param {String} host The host to be highlighted
 * @param {Boolean} def Whether the transformation to remove is a default
 *            transformation.
 * @see {@link HighlightHostTransformation}
 */
Transformer.prototype.highlightHost = function(host) {
    this.highlightHostTransformation.addHost(host);
    this.highlightHostToIndex[host] = this.transformations.length;
};

/**
 * Unsets this transformer to highlight the specified host.
 * 
 * @param {String} host The host that is no longer to be highlighted
 * @see {@link HighlightHostTransformation}
 */
Transformer.prototype.unhighlighHost = function(host) {
    this.highlightHostTransformation.removeHost(host);
    delete this.highlightHostToIndex[host];
};

/**
 * Toggles highlighting of the specified host.
 * 
 * @param {String} host
 * @see {@link HighlightHostTransformation}
 */
Transformer.prototype.toggleHighlightHost = function(host) {
    if (this.highlightHostTransformation.isHighlighted(host)) {
        this.unhighlighHost(host);
    }
    else {
        this.highlightHost(host);
    }
};

/**
 * Sets this transformer to collapse the node and its group into one.
 * Intuitively, the node's group are the nodes surrounding the argument that
 * have no family.
 * 
 * @param {ModelNode} node
 * @see {@link CollapseSequentialNodesTransformation}
 */
Transformer.prototype.collapseNode = function(node) {
    this.collapseSequentialNodesTransformation.removeExemption(node);
};

/**
 * Sets this transformer to not collapse the node or any of the nodes in its
 * group. Intuitively, the node's group are the nodes surrounding the argument
 * that have no family.
 * 
 * @param {ModelNode} node
 * @see {@link CollapseSequentialNodesTransformation}
 */
Transformer.prototype.uncollapseNode = function(node) {
    this.collapseSequentialNodesTransformation.addExemption(node);
};

/**
 * Toggles collapsing of the node
 * 
 * @param {ModelNode} node
 * @see {@link CollapseSequentialNodesTransformation}
 */
Transformer.prototype.toggleCollapseNode = function(node) {
    this.collapseSequentialNodesTransformation.toggleExemption(node);
};

/**
 * Sets this transformer to highlight a motif found by a MotifFinder. Only one
 * motif can be highlighted at a time, thus if there is already a motif set to
 * be highlighted, that one is replaced.
 * 
 * @param {MotifFinder} motifFinder The motif finder that specifies which nodes
 *            and edges are to be highlighted
 * @param {Boolean} ignoreEdges edges will not be highlighted if true
 * @see {@link HighlightMotifTransformation}
 */
Transformer.prototype.highlightMotif = function(motifFinder, ignoreEdges) {
    this.highlightMotifTransformation = new HighlightMotifTransformation(motifFinder, ignoreEdges);
};

/**
 * Sets this transformer to not highlight motifs.
 * 
 * @see {@link HighlightMotifTransformation}
 */
Transformer.prototype.unhighlightMotif = function() {
    this.highlightMotifTransformation = null;
};

/**
 * Determines if a motif is currently set to be highlighted.
 * 
 * @returns {Boolean} True if a motif is currently set to be highlighted
 * @see {@link HighlightMotifTransformation}
 */
Transformer.prototype.hasHighlightedMotif = function() {
    return this.highlightMotifTransformation != null;
};

/**
 * Returns the motif group that represents the highlighted elements from the
 * last invocation of {@link Transformer#transform}. If transform has yet to be
 * called, this method returns null
 * 
 * @returns {MotifGroup}
 * @see {@link HighlightMotifTransformation}
 */
Transformer.prototype.getHighlightedMotif = function() {
    return this.highlighted;
};

/**
  * Returns the highlightMotifTransformation for this transformer. 
  * If highlightMotif has not been called, this method returns null
  *
  * @returns {HighlightMotifTransformation}
  */
Transformer.prototype.getHighlightMotifTransformation = function() {
    return this.highlightMotifTransformation;
}

Transformer.prototype.setHighlightMotifTransformation = function(hmt) {
    this.highlightMotifTransformation = hmt;
}

/**
 * Sets this transformer to highlight different hosts in the View
 * this transformer belongs to and the given View passed to the function
 */
 Transformer.prototype.showDiff = function(view) {
    if (this.viewToDiffTransform[view]) return;
    this.uniqueHosts = [];
    this.uniqueEvents = [];
	
    var trans = new ShowDiffTransformation(view, this.uniqueHosts, this.hiddenHosts, this.uniqueEvents, true);
    this.viewToDiffTransform[view] = trans;
    this.transformations.push(trans);
}

/**
 * Sets this transformer to not highlight different hosts 
 */
 Transformer.prototype.hideDiff = function(view) {
    var trans = this.viewToDiffTransform[view];
    if (trans) {
       var index = this.transformations.indexOf(trans);
       this.transformations.splice(index, 1);
       delete this.viewToDiffTransform[view];
    }
}

/**
 * Transforms the specified {@link VisualGraph} and the underlying
 * {@link ModelGraph} based on the settings of this transformer. Note that this
 * method is solely responsible for modifying visual and model graphs
 */
Transformer.prototype.transform = function(visualModel) {
    var originalHosts = visualModel.getHosts();
    // get the underlying modelGraph
    var graph = visualModel.getGraph();

    this.collapseSequentialNodesTransformation.transform(visualModel);

    var maxIndex = 0;
    for (var key in this.highlightHostToIndex) {
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

    if (this.highlightMotifTransformation != null) {
        this.highlightMotifTransformation.transform(visualModel);
        this.highlighted = this.highlightMotifTransformation.getHighlighted();
    }

    var hidden = {};
    for (var i = 0; i < originalHosts.length; i++) {
        var host = originalHosts[i];
        if (this.hostToHidingTransform[host]) {
            hidden[host] = true;
        }
    }

    this.highlightHostTransformation.getHiddenHosts().forEach(function(host) {
        hidden[host] = true;
    });

    this.hiddenHosts = Object.keys(hidden);
};