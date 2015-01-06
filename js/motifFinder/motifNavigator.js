/**
 * Constructs a new motif navigator
 * 
 * @classdesc
 * 
 * A MotifNavigator helps jump between motifs (i.e. by scrolling the window
 * based on the location of the motif). Typical usage involves adding motifs to
 * navigate between using {@link MotifNavigator#addMotif}, calling
 * {@link MotifNavigator#start}, and then using {@link MotifNavigator#prev} and
 * {@link MotifNavigator#next} to jump between motifs.
 * 
 * @constructor
 */
function MotifNavigator() {

    /** @private */
    this.motifDatas = [];

    /** @private */
    this.index = -1;

    /** @private */
    this.wrap = true;

    /** @private */
    this.hasStarted = false;

};

/**
 * @static
 * @const
 */
MotifNavigator.TOP_SPACING = 100;

/**
 * Adds a group of motifs to navigate between
 * 
 * @param {VisualGraph} visualGraph The visual graph that contains the motif
 *        group
 * @param {MotifGroup} motifGroup The group of motifs to add
 */
MotifNavigator.prototype.addMotif = function(visualGraph, motifGroup) {

    if (this.hasStarted) {
        throw new Exception("MotifNavigator.prototype.addMotif: You cannot call this method after invoking MotifNavigator.prototype.start");
    }

    var motifs = motifGroup.getMotifs();
    for (var m = 0; m < motifs.length; m++) {
        var motif = motifs[m];
        var top = Number.POSITIVE_INFINITY;

        var nodes = motif.getNodes();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var visualNode = visualGraph.getVisualNodeByNode(node);
            top = Math.min(top, visualNode.getY());
        }

        var data = new MotifNavigatorData(top, motif, visualGraph);
        this.motifDatas.push(data);
    }

};

/**
 * Sets whether or not the navigation "wraps". If wrap mode is on, the navigator
 * will jump back to the first motif after the last one (or back to the last one
 * after the first if going in a reversed order). Otherwise, the navigator will
 * remain at the last motif.
 * 
 * @param {Boolean} wrap The wrap mode
 */
MotifNavigator.prototype.setWrap = function(wrap) {
    this.wrap = wrap;
};

/**
 * Starts the motif navigator. This method should be called after all motifs
 * have been added using {@link MotifNavigator#addMotif}.
 */
MotifNavigator.prototype.start = function() {
    this.motifDatas.sort(function(a, b) {
        return a.getTop() - b.getTop();
    });

    this.hasStarted = true;
};

/**
 * Gets the number of motifs this class navigates between
 * 
 * @returns {Integer} the number of motifs this class navigates between
 */
MotifNavigator.prototype.getNumMotifs = function() {
    return this.motifDatas.length;
};

/**
 * Jumps to the next motif. Motifs are ordered in ascending order of the
 * y-coordinate of their top-most node. Thus, this method jumps to the motif
 * with the next largest y-coordinate
 */
MotifNavigator.prototype.next = function() {

    if (!this.hasStarted) {
        throw new Exception("MotifNavigator.prototype.next: You cannot call this method before invoking MotifNavigator.prototype.start");
    }

    this.index++;

    if (this.index >= this.getNumMotifs()) {
        this.index = this.wrap ? 0 : this.getNumMotifs();
    }

    this.handleCurrent();
};

/**
 * Jumps to the previous motif. Motifs are ordered in ascending order of the
 * y-coordinate of their top-most node. Thus, this method jumps to the motif
 * with the next smallest y-coordinate
 */
MotifNavigator.prototype.prev = function() {

    if (!this.hasStarted) {
        throw new Exception("MotifNavigator.prototype.prev: You cannot call this method before invoking MotifNavigator.prototype.start");
    }

    this.index--;

    if (this.index < 0) {
        this.index = this.wrap ? this.getNumMotifs() - 1 : -1;
    }

    this.handleCurrent();
};

/**
 * Handles the currently selected motif
 * 
 * @private
 */
MotifNavigator.prototype.handleCurrent = function() {
    if (this.index >= this.getNumMotifs() || this.index < 0) {
        return;
    }

    var motifData = this.motifDatas[this.index];

    var position = motifData.getTop() - MotifNavigator.TOP_SPACING;
    position = Math.max(0, position);
    $(window).scrollTop(position);
};

/**
 * Constructs a new MotifNavigatorData with the specified data
 * 
 * @classdesc
 * 
 * MotifNavigatorData is a simple data transfer object
 * 
 * @constructor
 * @param {Number} top The smallest y coordinate among all the nodes in the
 *        motif
 * @param {Motif} Motif The motif itself
 * @param {VisualGraph} visualGraph The visual graph containing the motif
 */
function MotifNavigatorData(top, motif, visualGraph) {

    /** @private */
    this.top = top;

    /** @private */
    this.motif = motif;

    /** @private */
    this.visualGraph = visualGraph;
}

/**
 * Gets the smallest y coordinate among all the nodes in the motif
 * 
 * @returns {Number} the smallest y coordinate among all the nodes in the motif
 */
MotifNavigatorData.prototype.getTop = function() {
    return this.top;
};

/**
 * Gets the motif itself
 * 
 * @returns {Motif} the motif itself
 */
MotifNavigatorData.prototype.getMotif = function() {
    return this.motif;
};

/**
 * Gets the visual graph containing the motif
 * 
 * @returns {VisualGraph} the visual graph containing the motif
 */
MotifNavigatorData.prototype.getVisualGraph = function() {
    return this.visualGraph;
};