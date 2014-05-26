/**
 * A LogEvent represents a single event from the raw log
 * and contains the text of the log, a reference to the
 * vector timestamp, and other contexual information
 * @param {String}          text            the text of the log (description)
 * @param {String}          host            the host the event belongs to
 * @param {VectorTimeStamp} vectorTimestamp the vector timestamp of the log
 * @param {Number}          lineNum         the line number of the event in
 *                                          the log
 */
function LogEvent(text, host, vectorTimestamp, lineNum) {
  this.text = text;                                  // Log line this node represents
  this.host = host;                                  // Id of the host on which this event occurred
  this.vectorTimestamp = vectorTimestamp;            // Timestamp mapping from hostId to logical time
  this.lineNum = lineNum || 0;                       // Line number of our log event
  this.time = this.vectorTimestamp.clock[this.host]; // Local time for this event
}