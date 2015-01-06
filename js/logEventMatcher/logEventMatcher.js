/**
 * Constructs a LogEventMatcher that can be used to match {@link LogEvent}s
 * against the specified query
 * 
 * @classdesc
 * 
 * A LogEventMatcher is used to determine if a {@link LogEvent} matches a text
 * query.
 * 
 * @constructor
 * @param {String} query The text query
 */
function LogEventMatcher(query) {

    this.query = query;

    try {

        this.tokenizer = new LEMTokenizer(query);

        var parser = new LEMParser(this.tokenizer);

        this.ast = parser.parse();

        this.interpreter = new LEMInterpreter(this.ast);
    }
    catch (e) {
        if (e instanceof Exception) {
            e.setUserFriendly(true);
            e.append("\n");
            var querytext = query + "\n";

            var count = this.tokenizer.getNumCharsConsumed() - 1;
            while (count-- > 0) {
                querytext += " ";
            }
            querytext += "^";
            e.append(querytext, "code");
        }
        throw e;
    }

}

/**
 * Returns true if the logEvent matches this' query
 * 
 * @param {LogEvent} logEvent The LogEvent to test
 * @returns {Boolean} True if the log event matches
 */
LogEventMatcher.prototype.match = function(logEvent) {
    try {
        return this.interpreter.interpret(logEvent);
    }
    catch (e) {
        if (e instanceof Exception) {
            e.setUserFriendly(true);
            e.append("\n");
            e.append(this.query, "code");
        }
        throw e;
    }
};

/**
 * Returns true if any of the log events provided match this' query
 * 
 * @param {Array<LogEvent>} logEvents An array of log events to test
 * @returns {Boolean} True if any of the log events match
 */
LogEventMatcher.prototype.matchAny = function(logEvents) {
    for (var i = 0; i < logEvents.length; i++) {
        if (this.match(logEvents[i])) {
            return true;
        }
    }
    return false;
};
