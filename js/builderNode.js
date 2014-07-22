/**
 * Constructs a BuilderNode
 * 
 * @classdesc
 * 
 * BuilderNodes are nodes in a {@link BuilderGraph}. That is, they are nodes in a user
 * defined motif. They are not results of a search for a motif. Rather, they
 * define the motif structure that should be searched for. BuilderNodes are so
 * named because they are the result of the user-facing graph builder.
 * 
 * @constructor
 * @extends AbstractNode
 */
function BuilderNode() {
    AbstractNode.apply(this);

}

// BuilderNode extends Node
BuilderNode.prototype = Object.create(AbstractNode.prototype);
BuilderNode.prototype.constructor = BuilderNode;