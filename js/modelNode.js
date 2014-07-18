/**
 * @classdesc
 * 
 * ModelNodes are part of ModelGraphs. Together, they model a set of LogEvents.
 * A ModelNode by itself can model one or more LogEvents
 * 
 * @constructor
 * @param {Array<LogEvent>} logEvents The array of logEvents from which a ModelGraph
 * should be constructed
 */
function ModelNode(logEvents) {
    AbstractNode.call(this);

    /** @private */
    this.logEvents = logEvents;
}

//ModelNode extends AbstractNode
ModelNode.prototype = Object.create(AbstractNode.prototype);
ModelNode.prototype.constructor = ModelNode;

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
ModelNode.prototype.getLogEvents = function() {
    return this.logEvents.slice();
};

ModelNode.prototype.getFirstLogEvent = function() {
    return this.logEvents[0];
};

/**
 * Gets the number of LogEvents this node holds
 * 
 * @returns {Number} the number of LogEvents
 */
ModelNode.prototype.getLogEventCount = function() {
    return this.logEvents.length;
};
