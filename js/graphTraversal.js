/**
 * A GraphTraversal defines a strategy for traversing an AbstractGraph.
 * 
 * The two key components of GraphTraversal are a set of states and a set of
 * VisitFunctions, both of which the user of this class must define. States are
 * Strings that indicate the state of the current traversal. VisitFunctions
 * perform arbitrary operations given the current node the GraphTraversal is
 * visiting.
 * 
 * You can associate visitFunctions with states so that different VisitFunctions
 * are invoked when the traversal is in different states.
 * 
 * Consider the following example: You want to traverse from head towards tail
 * the nodes of host "a" until you find a node n that communicates with host
 * "b". After that, you want to traverse from n to head the nodes of host "b".
 * There might be two states: "on a" and "on b". The VisitFunctions for the two
 * states might be as follows:
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
 * Alternately, you could chose to only define a defaultVisitFunction and decide what should
 * be done based on the state variable
 * 
 * @constructor
 * @class
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
    this.hasEnded = false;

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

    this.hasEnded = false;
};

/**
 * Sets the visit function for a state. The visit function will be invoked when
 * the GraphTraversal is in the given state. If there was previously a visit
 * function already defined for the state, it will be replaced.
 * 
 * @param {String} state The state
 * @param {Function} fn The visit function
 */
GraphTraversal.prototype.setVisitFunction = function(state, fn) {
    this.visitFunctions[state] = fn;
};

/**
 * Sets the default visit function. The default visit function will be invoked
 * if there is no other visit function bound to the current state, OR if the
 * current state is null.
 * 
 * @param {Function} fn The visit function to set as default
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
 * Ends the traversal. After this method is invoked, no more nodes will be
 * visited.
 */
GraphTraversal.prototype.end = function() {
    this.hasEnded = true;
};

/**
 * Executes a single step of the traversal. The correct visit function is
 * fetched and is executed. The visit functions are invoked with four parameters:
 * function(gt, node, state, data)
 * gt is a reference the the invoking GraphTraversal. Node is the current node that
 * is being visited. State is the current state. Data is an object that can be
 * used to pass arbitrary data to the funciton.
 * 
 * @returns {Boolean}
 */
GraphTraversal.prototype.step = function() {
    if (this.hasEnded) {
        return false;
    }

    if (this.state == null || !this.visitFunctions[this.state]) {
        if (this.defaultVisitFunction == null) {
            throw new Exception("GraphTraversal.prototype.step: no valid visit function");
        }
        this.defaultVisitFunction(this, this.currentNode, this.state, this.currentData);
    }
    else {
        this.visitFunctions[this.state](this, this.currentNode, this.state, this.currentData);
    }

    return true;
};

/**
 * "Runs" the traversal. The traversal will be continuously stepped though (i.e
 * with step()) until the traversal has ended.
 * 
 * @returns {Boolean}
 */
GraphTraversal.prototype.run = function() {

    var hasRun = false;
    while (this.step()) {
        hasRun = true;
    }
    return hasRun;
};
