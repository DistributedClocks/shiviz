/**
 * Constructs a ModelNode given an array of {@link LogEvent}s that the
 * ModelNode should represent
 * 
 * @classdesc
 * 
 * ModelNodes are part of {@link ModelGraph}s. Together, they model a set of
 * {@link LogEvent}s. A ModelNode by itself can model one or more LogEvents
 * 
 * @constructor
 * @extends AbstractNode
 * @param {Array<LogEvent>} logEvents The array of LogEvents from which a
 *            ModelGraph should be constructed
 */
function ModelNode(logEvents) {
    AbstractNode.call(this);

    /** @private */
    this.logEvents = logEvents.slice();
}

// ModelNode extends AbstractNode
ModelNode.prototype = Object.create(AbstractNode.prototype);
ModelNode.prototype.constructor = ModelNode;

/**
 * <p>
 * Gets the log events associated with the node
 * </p>
 * 
 * <p>
 * This function makes no guarantees about the ordering of LogEvents in the
 * array returned. Also note that a new array is created to prevent modification
 * of the underlying private data structure, so this function takes linear
 * rather than constant time on the number of LogEvents.
 * </p>
 * 
 * @returns {Array<LogEvent>} an array of associated log events
 */
ModelNode.prototype.getLogEvents = function() {
    return this.logEvents.slice();
};

/**
 * Gets the first LogEvent associated with this node. The first log event is
 * simply the first element passed in the array of log events passed to the
 * constructor. This is equivalent to calling {@link ModelNode#GetLogEvents}()[0].
 * If there is no first LogEvent, this method returns null.
 * 
 * @returns {LogEvent} the first log event.
 */
ModelNode.prototype.getFirstLogEvent = function() {
    if (this.logEvents.length == 0) {
        return null;
    }
    return this.logEvents[0];
};

/**
 * Gets the number of {@link LogEvent}s this node holds
 * 
 * @returns {Number} the number of LogEvents
 */
ModelNode.prototype.getLogEventCount = function() {
    return this.logEvents.length;
};
