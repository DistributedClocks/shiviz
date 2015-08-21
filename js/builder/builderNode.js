/**
 * Constructs a BuilderNode
 * 
 * @classdesc
 * 
 * BuilderNodes are nodes in a {@link BuilderGraph}. That is, they are nodes in
 * a user defined motif. They are not results of a search for a motif. Rather,
 * they define the motif structure that should be searched for. BuilderNodes are
 * so named because they are the result of the user-facing graph builder.
 * 
 * @constructor
 * @extends AbstractNode
 */
function BuilderNode() {
    AbstractNode.call(this);

}

// BuilderNode extends Node
BuilderNode.prototype = Object.create(AbstractNode.prototype);
BuilderNode.prototype.constructor = BuilderNode;

/**
 * Checks to see if this builder node belongs to a host with a constraint
 * @returns {Boolean} True if this node's host has a constraint and false otherwise
 */
BuilderNode.prototype.hasHostConstraint = function() {
	return this.hasHostConstraint;
}

/**
 * Sets the hasHostConstraint boolean to the given parameter
 * @param {Boolean} hasHostConstraint
 */
BuilderNode.prototype.setHasHostConstraint = function(hasHostConstraint) {
	this.hasHostConstraint = hasHostConstraint;
}