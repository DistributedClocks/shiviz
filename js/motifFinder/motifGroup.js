/**
 * Constructs a new MotifGroup with the specified initial list of motifs
 * 
 * @classdesc
 * 
 * A MotifGroup is simple a group of motifs with methods to add/remove motifs to
 * the group, etc. Note that all motifs contained in a MotifGroup are guaranteed
 * not to be empty - they will all have at least one node or edge.
 * 
 * @constructor
 * @param {?Array<Motif>} [motifs] the initial array of motifs
 */
function MotifGroup(motifs) {

    /** @private */
    this.motifs = [];

    if (motifs) {
        for (var i = 0; i < motifs.length; i++) {
            this.addMotif(motifs[i]);
        }
    }

}

/**
 * Adds a motif to this motifGroup. If the motif is "empty" (it contains no
 * nodes or edges), this method does nothing, and the empty motif will NOT be
 * added to this group.
 * 
 * @param {Motif} motif the motif to add to this group.
 */
MotifGroup.prototype.addMotif = function(motif) {
    if (motif.getNumNodes() == 0 && motif.getNumEdges() == 0) {
        return;
    }
    this.motifs.push(motif);
};

/**
 * Adds all of the motifs in another MotifGroup this this group. the other
 * MotifGroup will not be modified.
 * 
 * @param {MotifGroup} motifGroup The motif group whose motifs are to be added
 *        to this group
 */
MotifGroup.prototype.addMotifGroup = function(motifGroup) {
    var motifs = motifGroup.getMotifs();
    for (var i = 0; i < motifs.length; i++) {
        this.addMotif(motifs[i]);
    }
};

/**
 * Gets all of the motifs contained in this motif group
 * 
 * @returns {Array<Motif>} the motifs in this motif group as an array
 */
MotifGroup.prototype.getMotifs = function() {
    return this.motifs.slice();
};

/**
 * Gets all of the nodes in all of the motifs in this motif group.
 * 
 * @returns {Array<AbstractNode>} all of the nodes in all of the motifs in this
 *          motif group as an array
 */
MotifGroup.prototype.getNodes = function() {
    var result = [];

    this.motifs.forEach(function(motif) {
        result = result.concat(motif.getNodes());
    });

    return result;
};

/**
 * Gets all of the edges in all of the motifs in this motif group.
 * 
 * @returns {Array<Array<AbstractNode>>} all of the edges as an array. For
 *          information on how the edges are stored, see {@link Motif#getEdges}
 */
MotifGroup.prototype.getEdges = function() {
    var result = [];

    this.motifs.forEach(function(motif) {
        result = result.concat(motif.getEdges());
    });

    return result;
};