/**
 * Constructs a text query motif finder to match nodes based on the specified
 * query text
 * 
 * @classdesc
 * 
 * TextQueryMotifFinder is responsible finding nodes in a {@link ModelGraph}
 * that match the specified text query. Each found node is considered its own
 * {@link Motif} and are collectively returned as a {@link MotifGroup}.
 * 
 * @constructor
 * @param {String} query
 */
function TextQueryMotifFinder(query) {

    /** @private */
    this.logEventMatcher = new LogEventMatcher(query);
}

// TextQueryMotifFinder extends MotifFinder
TextQueryMotifFinder.prototype = Object.create(MotifFinder.prototype);
TextQueryMotifFinder.prototype.constructor = TextQueryMotifFinder;

/**
 * Overrides {@link MotifFinder#find}
 */
TextQueryMotifFinder.prototype.find = function(graph) {

    var motifGroup = new MotifGroup();

    var nodes = graph.getNodes();
    for (var i = 0; i < nodes.length; i++) {
        if (this.logEventMatcher.matchAny(nodes[i].getLogEvents())) {
            var motif = new Motif();
            motif.addNode(nodes[i]);
            motifGroup.addMotif(motif);
        }
    }

    return motifGroup;
};