/**
 * @classdesc
 * 
 * A LogEvent represents a single event from the raw log and contains the text
 * of the log, a reference to the vector timestamp, and other contextual
 * information.
 * 
 * @constructor
 * @param {String} text the text of the log (description)
 * @param {String} host the host the event belongs to
 * @param {VectorTimestamp} vectorTimestamp the vector timestamp of the log
 * @param {Number} lineNum the line number of the event in the log
 */
function LogEvent(text, vectorTimestamp, lineNum) {
    /** @private */
    this.id = LogEvent.id++;

    /** @private */
    this.text = text;

    /** @private */
    this.host = vectorTimestamp.getOwnHost();

    /** @private */
    this.vectorTimestamp = vectorTimestamp;

    /** @private */
    this.lineNum = lineNum;
}

LogEvent.id = 0;

/**
 * Returns the LogEvent's unique ID
 * 
 * @returns {Number} the ID
 */
LogEvent.prototype.getId = function() {
    return this.id;
};

/**
 * Returns the log text associated with this LogEvent
 * 
 * @returns {String} the log text
 */
LogEvent.prototype.getText = function() {
    return this.text;
};

/**
 * Returns the host that the LogEvent was generated by
 * 
 * @returns {String} the name of the host
 */
LogEvent.prototype.getHost = function() {
    return this.host;
};

/**
 * Returns the VectorTimestamp associated with this LogEvent
 * 
 * @returns {VectorTimestamp}
 */
LogEvent.prototype.getVectorTimestamp = function() {
    return this.vectorTimestamp;
};

/**
 * Returns line number in the raw input string that this log event was parsed
 * from.
 * 
 * @returns {Number}
 */
LogEvent.prototype.getLineNumber = function() {
    return this.lineNum;
};