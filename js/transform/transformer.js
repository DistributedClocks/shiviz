/**
 * Constructs a Transformer for a particular {@link View}
 * 
 * @classdesc
 * 
 * Transformer keeps track of transformations to be applied to a specific
 * VisualGraph and takes care of transforming the model.
 * 
 * @constructor
 * @param {VisualGraph} visualModel The VisualGraph this transformer is
 *            responsible for.
 */
function Transformer(visualModel) {

    /** @private */
    this.visualModel = visualModel;

    /** @private */
    this.transformations = [];

    /** @private */
    this.defaultTransformations = [];

    /** @private */
    this.hiddenByHighlight = {};
}

/**
 * Gets transformations
 * 
 * @param {Function} filter A function returning a boolean by which to filter
 *            the transformations
 * @param {Boolean} isDefault Whether to look in default transformations or
 *            regular transformations
 * @return {Array<Transformation>} The list of transformations
 */
Transformer.prototype.getTransformations = function(filter, isDefault) {
    var tfs = isDefault ? this.defaultTransformations : this.transformations;
    if (filter instanceof Function)
        return tfs.filter(filter);
    else
        return tfs;
};

/**
 * Adds a transformation
 * 
 * @param {Transformation} tf The transformation to add
 * @param {Boolean} isDefault Whether the transformation is a default
 *            transformation
 */
Transformer.prototype.addTransformation = function(tf, isDefault) {
    if (isDefault)
        this.defaultTransformations.push(tf);
    else
        this.transformations.push(tf);
};

/**
 * Removes a transformation
 * 
 * @param {Function|Transformation} tf A predicate function that returns true if
 *            given transformation is to be removed, OR the transformation that
 *            is to be removed
 */
Transformer.prototype.removeTransformation = function(tf) {
    this.transformations = this.transformations.filter(function(t) {
        if (tf instanceof Function)
            return !tf(t);
        else
            return !(tf == t);
    });
};

/**
 * Gets the model of the transformer
 * 
 * @returns {VisualGraph} The model the transformer acts on
 */
Transformer.prototype.getVisualModel = function() {
    return this.visualModel;
};

/**
 * Sets the model of the transformer
 * 
 * @param {VisualGraph} visualModel The model the transformer should act on
 */
Transformer.prototype.setVisualModel = function(visualModel) {
    this.visualModel = visualModel;
};

/**
 * Gets the hosts hidden by transformations in the transformer
 * @return {Object} Hidden hosts, with host IDs as keys
 */
Transformer.prototype.getHiddenHosts = function() {
    var hiddenHosts = {};
    this.transformations.forEach(function(tf) {
        if (tf instanceof HideHostTransformation)
            hiddenHosts[tf.getHost()] = true;
    });

    return $.extend(hiddenHosts, this.hiddenByHighlight);
}

/**
 * Gets the set of hosts hidden by highlight transformations
 * @return {Object} Hosts hidden by highlight transformation
 */
Transformer.prototype.getHiddenByHighlight = function() {
    return this.hiddenByHighlight;
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
Transformer.prototype.transform = function() {
    var self = this;

    var hh = this.transformations.filter(function(t) {
        return t instanceof HighlightHostTransformation;
    });
    if (hh.length) {
        var lhh = hh[hh.length - 1];
        var oh = lhh.getHosts()[0];

        hh.slice(0, hh.length - 1).forEach(function(t) {
            t.ignore = true;
            lhh.addHost(t.getHosts()[0]);
        });
    }

    this.hiddenByHighlight = {};

    var tfs = this.transformations.concat(this.defaultTransformations);
    var highHosts = [];
    tfs.forEach(function(t) {
        if (t instanceof Transformation) {
            if (highHosts.length) {
                var highlight = new HighlightHostTransformation(highHosts);
                highlight.transform(self.visualModel);
                highlight.getHiddenHosts().forEach(function(host) {
                    self.hiddenByHighlight[host] = true;
                });
                highHosts = [];
            }

            t.transform(self.visualModel);
        } else if (t.type == "highlight") {
            highHosts.push(t.host);
        }
    });

    if (hh.length) {
        lhh.clearHosts();
        lhh.addHost(oh);
    }
};