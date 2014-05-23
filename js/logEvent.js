function LogEvent(text, host, vectorTimestamp, lineNum) {
  this.text = text;    // Log line this node represents
  this.host = host;        // Id of the host on which this event occurred
  this.vectorTimestamp = vectorTimestamp;          // Timestamp mapping from hostId to logical time
  this.lineNum = lineNum || 0; // Line number of our log event
  this.time = this.vectorTimestamp.clock[this.host];    // Local time for this event
}

