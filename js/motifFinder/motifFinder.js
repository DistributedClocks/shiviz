/**
 * The constructor for this abstract class may be invoked by sub-classes
 * 
 * @classdesc
 * 
 * MotifFinders define an algorithm for finding a specific {@link Motif}. 
 * In the context of MotifFinders, {@link Motif}s are sub-graphs of a larger
 * {@link ModelGraph} that are of some importance. 
 * 
 * Every
 * MotifFinder must implement the {@link MotifFinder#find} method, which is solely
 * responsible for performing the actual search for motifs
 * 
 * @constructor
 * @abstract
 */
function MotifFinder() {
    
    if(this.constructor == MotifFinder) {
        throw new Exception("Cannot instantiate MotifFinder; MotifFinder is an abstract class");
    }
}

/**
 * The find method is solely responsible for performing the actual search for a motif.
 * 
 * @abstract
 * @param {ModelGraph} graph The graph on which the search should be performed
 * @returns {Motif} The motif found
 */
MotifFinder.prototype.find = function(graph) {
    
};

