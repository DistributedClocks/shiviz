function LogParser(rawString, delimiter) {
    
    /** @private */
    this.rawString = rawString.trim();
    
    /** @private */
    this.delimiter = delimiter;
    
    /** @private */
    this.labels = [];
    
    /** @private */
    this.executions = {};

    if(this.delimiter != null && this.delimiter.trim() != "") {
        this.delimiter = this.delimiter.trim();
        
        var delimRegex = new NamedRegExp(delimiter, "m");
        var currExecs = this.rawString.split(delimRegex.no);
        var currLabels = [""];
        
        if (delimRegex.names.indexOf("trace") >= 0) {
            var match;
            while (match = delimRegex.exec(this.rawString)) {
                currLabels.push(match.trace);
            }
        }
        
        for(var i = 0; i < currExecs.length; i++) {
            if(currExecs[i].trim().length > 0) {
                this.executions[currLabels[i]] = new ExecutionParser(currExecs[i], currLabels[i]);
                this.labels.push(currLabels[i]);
            }
        }
    }
    else {
        this.labels.push("");
        this.executions[""] = new ExecutionParser(this.rawString, "");
    }

}

LogParser.prototype.getLabels = function() {
    return this.labels.slice();
};

LogParser.prototype.getExecutionParser = function(label) {
    if(!this.executions[label]) {
        return null;
    }
    return this.executions[label];
};


function ExecutionParser(rawString, label) {
    
    /** @private */
    this.rawString = rawString;
    
    /** @private */
    this.label = label;
    
    /** @private */
    this.rawLines = [];
    
    /** @private */
    this.textStrings = [];
   
    /** @private */
    this.timestampStrings = [];
    
    /** @private */
    this.timestamps = [];
    
    /** @private */
    this.logEvents = [];
    
    /** @private */
    this.graph = null;
     
        
    this.rawLines = this.rawString.split("\n");
    
    var loc = 0;
    while(loc < this.rawLines.length) {
        while(loc < this.rawLines.length && this.rawLines[loc].trim() == "") {
            loc++;
        }
        if(loc >= this.rawLines.length) {
            break;
        }
        
        var lineNum = loc;
        var text = this.rawLines[loc++].trim();
        this.textStrings.push(text);
        
        while(loc < this.rawLines.length && this.rawLines[loc].trim() == "") {
            loc++;
        }
        if(loc >= this.rawLines.length) {
            throw new Exception("The last event in the log appears to be missing a vector timestamp", true);
        }
        
        var timestampString = this.rawLines[loc].trim();
        this.timestampStrings.push(timestampString);
        var vt = parseTimestamp(timestampString, loc);
        this.timestamps.push(vt);
        this.logEvents.push(new LogEvent(text, vt, lineNum));
        loc++;
    }
    
    this.graph = new Graph(this.logEvents);

    
    function parseTimestamp(text, line) {
        var i = text.indexOf(" ");
        var parts = [text.slice(0,i), text.slice(i+1)]; //TODO: make better
        
        var clock = null;
        try {
            clock = JSON.parse(parts[1].trim());
        }
        catch (err) {
            console.log(parts[1].trim());
            var exception = new Exception("An error occured while trying to parse the vector timestamp on line " + (line + 1) + ":");
            exception.append(text, "code");
            exception.append("The error message from the JSON parser reads:\n");
            exception.append(err.toString(), "italic");
            exception.setUserFriendly(true);
            throw exception;
        }
        
        try {
            var ret = new VectorTimestamp(clock, parts[0].trim()); 
            return ret;
        }
        catch (exception) {
            exception.prepend("An error occured while trying to parse the vector timestamp on line " + (line + 1) + ":\n\n");
            exception.append(text, "code");
            exception.setUserFriendly(true);
            throw exception;
        }
    }
    
}

ExecutionParser.prototype.getGraph = function() {
    return this.graph;
};

ExecutionParser.prototype.getLogEvents = function() {
    return this.logEvents;
};