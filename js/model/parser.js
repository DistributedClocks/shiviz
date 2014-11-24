/**
 * Constructs a LogParser to parse the provided raw log text.
 * 
 * @classdesc
 * 
 * <p>
 * LogParser can be used to transform raw log text to {@link LogEvent}s The
 * LogParser class per se is only responsible for dividing the raw text into
 * different executions according to the supplied delimiter. It then creates one
 * {@link ExecutionParser} for each execution to which to task for parsing is
 * then delegated.
 * </p>
 * 
 * <p>
 * The raw log potentially contains text for multiple executions. Delimiters
 * demarcate where one execution's text ends and another begins. Labels can be
 * given to executions by specifying a "trace" capture group within the
 * delimiter regex. (So the label text must be part of the delimiter). This
 * label can later be used to identify an execution. If an execution's text is
 * not preceeded by a delimiter, it is given the empty string as its label.
 * </p>
 * 
 * @constructor
 * @param {String} rawString the raw log text
 * @param {NamedRegExp} delimiter a regex that specifies the delimiter. Anything
 *            that matches the regex will be treated as a delimiter. A delimiter
 *            acts to separate different executions.
 * @param {NamedRegExp} regexp A regex that specifies the log parser. The parser
 *            must contain the named capture groups "clock", "event", and "host"
 *            representing the vector clock, the event string, and the host
 *            respectively.
 */
function LogParser(rawString, delimiter, regexp) {

    /** @private */
    this.rawString = rawString.trim();

    /** @private */
    this.delimiter = delimiter;

    /** @private */
    this.regexp = regexp;

    /** @private */
    this.labels = [];

    /** @private */
    this.executions = {};

    var names = this.regexp.getNames();
    if (names.indexOf("clock") < 0 || names.indexOf("host") < 0 || names.indexOf("event") < 0) {
        var e = new Exception("The parser RegExp you entered does not have the necessary named capture groups.\n", true);
        e.append("Please see the documentation for details.");
        throw e;
    }

    if (this.delimiter != null) {
        var currExecs = this.rawString.split(this.delimiter.no);
        var currLabels = [ "" ];

        if (this.delimiter.getNames().indexOf("trace") >= 0) {
            var match;
            while (match = this.delimiter.exec(this.rawString)) {
                currLabels.push(match.trace);
            }
        }

        for (var i = 0; i < currExecs.length; i++) {
            if (currExecs[i].trim().length > 0) {
                var currlabel = currLabels[i];
                if(this.executions[currlabel]) {
                    throw new Exception("Execution names must be unique. There are multiple executions called \"" + currlabel + "\"", true);
                }
                this.executions[currlabel] = new ExecutionParser(currExecs[i], currlabel, regexp);
                this.labels.push(currlabel);
            }
        }
    }
    else {
        this.labels.push("");
        this.executions[""] = new ExecutionParser(this.rawString, "", regexp);
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
 * Returns the {@link LogEvent}s parsed by this. The ordering of LogEvents in
 * the returned array is guaranteed to be the same as the order in which they
 * were encountered in the raw log text
 * 
 * @param {String} label The label of the execution you want to get log events
 *            from.
 * @returns {Array<LogEvent>} An array of LogEvents
 */
LogParser.prototype.getLogEvents = function(label) {
    if (!this.executions[label])
        return null;
    return this.executions[label].logEvents;
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
 * @param {NamedRegExp} regexp The RegExp parser
 */
function ExecutionParser(rawString, label, regexp) {

    /** @private */
    this.rawString = rawString;

    /** @private */
    this.label = label;

    /** @private */
    this.timestamps = [];

    /** @private */
    this.logEvents = [];

    var match;
    while (match = regexp.exec(rawString)) {
        var newlines = rawString.substr(0, match.index).match(/\n/g);
        var ln = newlines ? newlines.length + 1 : 1;

        var clock = match.clock;
        var host = match.host;
        var event = match.event;

        var fields = {};
        regexp.getNames().forEach(function(name, i) {
            if (name == "clock" || name == "event")
                return;

            fields[name] = match[name];
        });

        var timestamp = parseTimestamp(clock, host, ln);
        this.timestamps.push(timestamp);
        this.logEvents.push(new LogEvent(event, timestamp, ln, fields));
    }

    if (this.logEvents.length == 0)
        throw new Exception("The parser RegExp you entered does not capture any events for the execution " + label, true);

    function parseTimestamp(clockString, hostString, line) {
        try {
            clock = JSON.parse(clockString);
        }
        catch (err) {
            var exception = new Exception("An error occured while trying to parse the vector timestamp on line " + (line + 1) + ":");
            exception.append(clockString, "code");
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
            exception.append(clockString, "code");
            exception.setUserFriendly(true);
            throw exception;
        }
    }

}
