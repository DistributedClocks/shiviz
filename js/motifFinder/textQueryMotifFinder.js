
function TextQueryMotifFinder(query) {
    
    this.logEventMatcher = new LogEventMatcher(query);
}

// TextQueryMotifFinder extends MotifFinder
TextQueryMotifFinder.prototype = Object.create(MotifFinder.prototype);
TextQueryMotifFinder.prototype.constructor = TextQueryMotifFinder;


TextQueryMotifFinder.prototype.find = function(graph) {

    var motif = new Motif();
    var context = this;
    var nodes = graph.getNodes().filter(function(node) {
        return context.logEventMatcher.matchAny(node.getLogEvents());
    });
    motif.addAllNodes(nodes);
    return motif;
};