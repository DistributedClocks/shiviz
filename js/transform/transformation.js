/**
 * Constructor for Transformation. This may be invoked by concrete sub-classes
 * 
 * @classdesc
 * 
 * A graph transformation takes a graph as input and modifies it in place. Each
 * type of transformation is defined in its own class.
 * 
 * Graph transformations should strive to preserve the definitions of 'parent',
 * 'child', 'next' and 'previous' as defined in {@link AbstractNode}
 * 
 * Each transformation should declare a priority field of type Number.
 * Transformations of highest priority will be applied first.
 * 
 * @constructor
 * @abstract
 */
function Transformation() {
     if (this.constructor == Transformation) {
         throw new Exception("Cannot instantiate Transformation; Transformation is an abstract class");
     }
};

/**
 * The transform method is solely responsible for performing the actual
 * transformation. The provided VisualGraph and its underlying
 * {@link ModelGraph} is modified in place
 * 
 * @abstract
 * @param {VisualGraph} model
 */
Transformation.prototype.transform = function(model) {
};
