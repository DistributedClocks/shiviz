function GraphFactory(rawString, delimiter) {
    
    /** @private */
    this.rawString = rawString.trim();
    
    this.delimiter = delimiter;
    
    this.labels = [];
    
    /** @private */
    this.executionStrings = [];
    
    /** @private */
    this.textStrings = [];
   
    /** @private */
    this.timestampStrings = [];
    
    this.timestamps = [];
    
    this.logEvents = [];
    
    if(this.delimiter != null) {
        this.delimiter = this.delimiter.trim();
    }
}

/**
 * @private
 */
GraphFactory.prototype.parseRawString = function() {
    
    if(delimiter != null) {
        var delimRegex = new NamedRegExp(delimiter, "m");
        var currExecs = this.rawString.split(delimRegex.no);
        var currLabels = [""];
        
        if (delimRegex.names.indexOf("trace") >= 0) {
            var match;
            while (match = delimRegex.exec(log)) {
                currLabels.push(match.trace);
            }
        }
        
        for(var i = 0; i < currExecs.length; i++) {
            if(currExecs[i].trim().length > 0) {
                this.executionStrings.push(currExecs[i]);
                this.labels.push(currLabels[i]);
            }
        }
        
    }
    else {
        this.executionStrings = [ this.rawString ];
    }
    
};

/**
 * @private
 */
GraphFactory.prototype.parseExecutionStrings = function() {
    
    for(var i = 0; i < this.executionStrings.length; i++) {
        
        this.textStrings.push([]);
        this.timestampStrings.push([]);
        
        var execArray = executionStrings[i].split(/\n[\s\n]*/g);
        
        for(var j = 0; j < execArray.length; j += 2) {
            this.textStrings[i].push(execArray[j].trim());
            this.timestampStrings[i].push(execArray[j+1].trim());
        }
    }

};

/**
 * @private
 */
GraphFactory.prototype.parseTimestampStrings = function() {
    
    for(var i = 0; i < this.timestampStrings.length; i++) {
        
        this.timestamps.push([]);
        
        for(var j = 0; j < this.timestampStrings[i].length; j++) {
            var parts = this.timestampStrings[i][j].split(/\s/);
            
            var clock = null;
            try {
                clock = JSON.parse(parts[1].trim());
            }
            catch (err) {
                var exception = new Exception("An error occured while trying to parse the vector timestamp on line " + (i + 1) + ":");
                exception.append(stamp.substring(spacer + 1), "code");
                exception.append("The error message from the JSON parser reads:\n");
                exception.append(err.toString(), "italic");
                exception.setUserFriendly(true);
                throw exception;
            }
            
            try {
                this.timestamps[i].push(new VectorTimestamp(clock, parts[0].trim())); 
            }
            catch (exception) {
                exception.prepend("An error occured while trying to parse the vector timestamp on line " + (i + 1) + ":\n\n");
                exception.append(stamp.substring(spacer + 1), "code");
                exception.setUserFriendly(true);
                throw exception;
            }
            
        }
    }
};


/**
 * @private
 */
GraphFactory.prototype.assembleLogEvents = function() {
  
    for(var i = 0; i < this.textStrings.length; i++) {
        this.logEvents.push([]);
        for(var j = 0; j < this.textStrings[i].length; j++) {
//            var logEvent = new LogEvent(this.textStrings[i][j], vectorTimestamp, lineNum);
        }
    }
};

/**
 * Generates and returns a model from log lines. logLines is an array of
 * alternating log event, vector timestamp pairs. Assumes timestamps are in the
 * format 'localHostId {hostId_1:time_1, ..., hostId_n:time_n}'
 */
function generateGraphFromLog(logLines) {
    var logEvents = [];

    for (var i = 0; i < logLines.length; i++) {
        var log = logLines[i];
        if (log.length == 0)
            continue;
        i++;
        var stamp = logLines[i];
        var spacer = stamp.indexOf(" ");
        var host = stamp.substring(0, spacer);
        
        var clock = null;
        try {
            clock = JSON.parse(stamp.substring(spacer));
        }
        catch (err) {
            var exception = new Exception("An error occured while trying to parse the vector timestamp on line " + (i + 1) + ":");
            exception.append(stamp.substring(spacer + 1), "code");
            exception.append("The error message from the JSON parser reads:\n\n");
            exception.append(err.toString(), "italic");
            exception.setUserFriendly(true);
            throw exception;
        }
        
        try {
            var vt = new VectorTimestamp(clock, host);
            logEvents.push(new LogEvent(log, host, vt, i));
        }
        catch (exception) {
            exception.prepend("An error occured while trying to parse the vector timestamp on line " + (i + 1) + ":\n\n");
            exception.append(stamp.substring(spacer + 1), "code");
            exception.setUserFriendly(true);
            throw exception;
        }
    }
    
    return new Graph(logEvents);

}
