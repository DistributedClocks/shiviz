/**
 * Constructs a LogParser to parse the provided raw log text.
 * 
 * @classdesc
 * 
 * <p>LogParser can be used to transform raw log text to {@link LogEvent}s The LogParser
 * class per se is only responsible for dividing the raw text into different
 * executions according to the supplied delimiter. It then creates one
 * {@link ExecutionParser} for each execution to which to task for parsing is then
 * delegated.</p>
 * 
 * <p>The raw log potentially contains text for multiple executions. Delimiters
 * demarcate where one execution's text ends and another begins. Labels can be
 * given to executions by specifying a "trace" capture group within the
 * delimiter regex. (So the label text must be part of the delimiter). This
 * label can later be used to identify an execution. If an execution's text is
 * not preceeded by a delimiter, it is given the empty string as its label.</p>
 * 
 * @constructor
 * @param {String} rawString the raw log text
 * @param {NamedRegExp} delimiter a regex that specifies the delimiter. Anything
 *        that matches the regex will be treated as a delimiter. A delimiter
 *        acts to separate different executions.
 */
function LogParser(rawString, delimiter) {

    /** @private */
    this.rawString = rawString.trim();

    /** @private */
    this.delimiter = delimiter;

    /** @private */
    this.labels = [];

    /** @private */
    this.executions = {};

    if (this.delimiter != null) {

        var currExecs = this.rawString.split(this.delimiter.no);
        var currLabels = [ "" ];

        if (this.delimiter.names.indexOf("trace") >= 0) {
            var match;
            while (match = this.delimiter.exec(this.rawString)) {
                currLabels.push(match.trace);
            }
        }

        for (var i = 0; i < currExecs.length; i++) {
            if (currExecs[i].trim().length > 0) {
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

/**
 * Gets all of the labels of the executions. The ordering of labels in the
 * returned array is guarenteed to be the same as the order in which they are
 * encountered in the raw log text
 * 
 * @returns {Array<String>} An array of all the labels.
 */
LogParser.prototype.getLabels = function() {
    return this.labels.slice();
};

/**
 * Gets the {@link ExecutionParser} for the execution with the specified label. The
 * ExecutionParser object can then be used to retrieve data parsed from that
 * execution's text.
 * 
 * @param {String} label The label of the execution you want to retrieve.
 * @returns {ExecutionParser} The execution parser associated with the specified
 *          execution
 */
LogParser.prototype.getExecutionParser = function(label) {
    if (!this.executions[label]) {
        return null;
    }
    return this.executions[label];
};

/**
 * @classdesc
 * 
 * ExecutionParser parses the raw text for one execution.
 * 
 * @constructor
 * @private
 * @param {String} rawString The raw string of the execution's log
 * @param {Label} label The label that should be associated with this execution
 * @returns
 */
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

    this.rawLines = this.rawString.split("\n");

    var loc = 0;
    while (loc < this.rawLines.length) {
        while (loc < this.rawLines.length && this.rawLines[loc].trim() == "") {
            loc++;
        }
        if (loc >= this.rawLines.length) {
            break;
        }

        var lineNum = loc;
        var text = this.rawLines[loc++].trim();
        this.textStrings.push(text);

        while (loc < this.rawLines.length && this.rawLines[loc].trim() == "") {
            loc++;
        }
        if (loc >= this.rawLines.length) {
            throw new Exception("The last event in the log appears to be missing a vector timestamp", true);
        }

        var timestampString = this.rawLines[loc].trim();
        this.timestampStrings.push(timestampString);
        var vt = parseTimestamp(timestampString, loc);
        this.timestamps.push(vt);
        this.logEvents.push(new LogEvent(text, vt, lineNum));
        loc++;
    }

    function parseTimestamp(text, line) {
        var i = text.indexOf(" ");
        var hostString = text.slice(0, i).trim();
        var clockString = text.slice(i + 1).trim();

        var clock = null;
        try {
            clock = JSON.parse(clockString);
        }
        catch (err) {
            console.log(clockString);
            var exception = new Exception("An error occured while trying to parse the vector timestamp on line " + (line + 1) + ":");
            exception.append(text, "code");
            exception.append("The error message from the JSON parser reads:\n");
            exception.append(err.toString(), "italic");
            exception.setUserFriendly(true);
            throw exception;
        }

        try {
            var ret = new VectorTimestamp(clock, hostString);
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

/**
 * Returns the LogEvents parsed by this. The ordering of LogEvents in the
 * returned array is guaranteed to be the same as the order in which they were
 * encountered in the raw log text
 * 
 * @returns {Array} An array of LogEvents
 */
ExecutionParser.prototype.getLogEvents = function() {
    return this.logEvents;
};