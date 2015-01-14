/**
 * Constructs a GraphTraversal
 * 
 * @classdesc
 * 
 * <p>
 * A GraphTraversal defines a strategy for traversing an {@link AbstractGraph}.
 * </p>
 * 
 * <p>
 * The two key components of GraphTraversal are a set of states and a set of
 * {@link GraphTraversal~VisitFunction VisitFunctions}, both of which the user
 * of this class must define. States are Strings that indicate the state of the
 * current traversal. VisitFunctions perform arbitrary operations given the
 * current node the GraphTraversal is visiting.
 * </p>
 * 
 * <p>
 * You can associate visitFunctions with states so that different VisitFunctions
 * are invoked when the traversal is in different states.
 * </p>
 * 
 * <p>
 * Consider the following example: You want to traverse from head towards tail
 * the nodes of host "a" until you find a node n that communicates with host
 * "b". After that, you want to traverse from n to head the nodes of host "b".
 * There might be two states: "on a" and "on b". The VisitFunctions for the two
 * states might be as follows:
 * </p>
 * 
 * <pre>
 * 'on a':
 * function(graphTraversal, node, state, data) {
 *     if(node.getChildByHost('b') != null) {
 *         graphTraversal.setCurrentNode(node.getChildByHost('b'));
 *         graphTraversal.setState('on b');
 *     }
 *     else {
 *         graphTraversal.setCurrentNode(node.getNext());
 *     }
 * }
 * 
 * 'on b':
 * function(graphTraversal, node, state, data) {
 *     if(!node.isHead()) {
 *         graphTraversal.setCurrentNode(node.getPrev());
 *     }
 * }
 * </pre>
 * 
 * <p>
 * Alternately, you could chose to only define a defaultVisitFunction and decide
 * what should be done based on the state variable
 * </p>
 * 
 * @constructor
 */
function GraphTraversal() {

    /** @private */
    this.visitFunctions = {};

    /** @private */
    this.defaultVisitFunction = null;

    /** @private */
    this.state = null;

    /** @private */
    this.currentNode = null;

    /** @private */
    this.currentData = null;

    /** @private */
    this._hasEnded = false;

    this.reset();
}

/**
 * Resets the state of the traversal. Bound visit functions will not be touched.
 */
GraphTraversal.prototype.reset = function() {
    this.state = null;

    this.currentNode = null;

    this.currentData = null;

    this.parent = {};

    this._hasEnded = false;
};

/**
 * A VisitFunction is invoked each time the GraphTraversal encounters a new
 * node. Which VisitFunction is invoked depends on what state the GraphTraversal
 * is in.
 * 
 * @callback GraphTraversal~VisitFunction
 * @param {GraphTraversal} gt The GraphTraversal object invoking the function
 * @param {AbstractNode} node The current node being visited
 * @param {String} state The current state
 * @param {Object} data The current data object.
 * @see {@link GraphTraversal#step}
 */

/**
 * Sets the visit function for a state. The visit function will be invoked when
 * the GraphTraversal is in the given state. If there was previously a visit
 * function already defined for the state, it will be replaced.
 * 
 * @param {String} state The state
 * @param {GraphTraversal~visitFunction} fn The visit function
 */
GraphTraversal.prototype.setVisitFunction = function(state, fn) {
    this.visitFunctions[state] = fn;
};

/**
 * Sets the default visit function. The default visit function will be invoked
 * if there is no other visit function bound to the current state, OR if the
 * current state is null.
 * 
 * @param {GraphTraversal~visitFunction} fn The visit function to set as default
 */
GraphTraversal.prototype.setDefaultVisitFunction = function(fn) {
    this.defaultVisitFunction = fn;
};

/**
 * Sets the current state
 * 
 * @param {String} state
 */
GraphTraversal.prototype.setState = function(state) {
    this.state = state;
};

/**
 * Sets the current node - the node that will be visited next.
 * 
 * @param {AbstractNode} node
 */
GraphTraversal.prototype.setCurrentNode = function(node) {
    this.currentNode = node;
};

/**
 * Sets the current data. The current data is an object that will be passed to
 * the visit function the next time it's invoked. It can be used to pass
 * arbitrary data
 * 
 * @param {*} data
 */
GraphTraversal.prototype.setCurrentData = function(data) {
    this.currentData = data;
};

/**
 * Ends the traversal. After this method is invoked, no more nodes will be
 * visited.
 */
GraphTraversal.prototype.end = function() {
    this._hasEnded = true;
};

/**
 * Determines if this traversal has ended
 * 
 * @returns {Boolean} true is this traversal has ended
 */
GraphTraversal.prototype.hasEnded = function() {
    return this._hasEnded;
};

/**
 * <p>
 * Executes a single step of the traversal. The correct
 * {@link GraphTraversal~VisitFunction VisitFunction} is fetched and is
 * executed. If there is a VisitFunction associated with the current state (i.e
 * via a previous call to {@link setVisitFunction}) and the current state is
 * not null, then that VisitFunction is invoked. Otherwise, the default visit
 * function is invoked. Whatever is returned by the VisitFunction will be
 * returned by this method
 * </p>
 * 
 * <p>
 * If this traversal has already {@link GraphTraversal#end end}ed, then this
 * method does nothing and returns null
 * </p>
 * 
 * @returns {*} The return value of the VisitFunction if one was executed, or
 *          null otherwise
 * @see {@link GraphTraversal#setVisitFunction}
 * @see {@link GraphTraversal#setDefaultVisitFunction}
 */
GraphTraversal.prototype.step = function() {
    if (this.hasEnded()) {
        return null;
    }

    return this.stepInner();
};

/**
 * This protected function is what actually executes the step.
 * {@link GraphTraversal#step} performs some validation and then calls this
 * function. Typically, classes extending this class will override this method
 * to specify what happens during each "step"
 * 
 * @protected
 * @returns {*} The return value of the VisitFunction if one was executed, or
 *          null otherwise
 * @see {@link GraphTraversal#setVisitFunction}
 * @see {@link GraphTraversal#setDefaultVisitFunction}
 */
GraphTraversal.prototype.stepInner = function() {
    if (this.state == null || !this.visitFunctions[this.state]) {
        if (this.defaultVisitFunction == null) {
            throw new Exception("GraphTraversal.prototype.step: no valid visit function");
        }
        return this.defaultVisitFunction(this, this.currentNode, this.state, this.currentData);
    }
    else {
        return this.visitFunctions[this.state](this, this.currentNode, this.state, this.currentData);
    }
};

/**
 * "Runs" the traversal. The traversal will be continuously stepped though (i.e
 * with step()) until the traversal has ended. The value returned by the last
 * call to {@link GraphTraversal#step step} will be returned by this method.
 * 
 * @returns {*} The value returned by the last call to step, or null if step was
 *          never invoked.
 */
GraphTraversal.prototype.run = function() {
    var ret = null;
    while (!this.hasEnded()) {
        ret = this.step();
    }
    return ret;

};
