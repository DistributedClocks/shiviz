/**
 * ModelNodes are part of ModelGraphs. Together, they model a set of LogEvents.
 * A ModelNode by itself can model one or more LogEvents
 */
function ModelNode(logEvents) {
    Node.call(this);

    /** @private */
    this.logEvents = logEvents;
}

/**
 * Gets the log events associated with the node
 * 
 * This function makes no guarantees about the ordering of LogEvents in the
 * array returned. Also note that a new array is created to prevent modification
 * of the underlying private data structure, so this function takes linear
 * rather than constant time on the number of LogEvents.
 * 
 * @return {Array<LogEvent>} an array of associated log events
 */
Node.prototype.getLogEvents = function() {
    return this.logEvents.slice();
};

Node.prototype.getFirstLogEvent = function() {
    return this.logEvents[0];
};

/**
 * Gets the number of LogEvents this node holds
 * 
 * @returns {Number} the number of LogEvents
 */
Node.prototype.getLogEventCount = function() {
    return this.logEvents.length;
};

// ModelNode extends Node
ModelNode.prototype = Object.create(Node.prototype);
ModelNode.prototype.constructor = ModelNode;