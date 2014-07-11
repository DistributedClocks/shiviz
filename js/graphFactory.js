/**
 * Generates and returns a model from log.
 * 
 * @param  {String}      log    Raw input log to be parsed
 * @param  {NamedRegExp} regexp Named regular expression used
 *                              to parse log. Must contain three capture
 *                              groups:
 *                               - clock for the vector timestamp
 *                               - host for the timestamp's host
 *                               - event for the log event's description
 * 
 * @return {Graph} Parsed graph model 
 */
function generateGraphFromLog(log, regexp) {
    var logEvents = [];

    var match;
    while (match = regexp.exec(log)) {
        var n = log.substr(0, match.index).match(/\n/g);
        var ln = n ? n.length + 1 : 1;

        var clock = match.clock;
        var host = match.host;
        var event = match.event;

        var fields = {};
        regexp.names.forEach(function (name, i) {
            if (name == "clock" || name == "host" || name == "event")
                return;

            fields[name] = match[name];
        });

        try {
            clock = JSON.parse(clock);
        }
        catch (err) {
            var exception = new Exception("An error occured while trying to parse the vector timestamp on line " + ln + ":");
            exception.append(match.clock, "code");
            exception.append("The error message from the JSON parser reads:\n");
            exception.append(err.toString(), "italic");
            exception.setUserFriendly(true);
            throw exception;
        }
        
        try {
            var vt = new VectorTimestamp(clock, host);
            logEvents.push(new LogEvent(event, host, vt, ln, fields));
        }
        catch (exception) {
            exception.prepend("An error occured while trying to parse the vector timestamp on line " + ln + ":\n\n");
            exception.append(match.clock, "code");
            exception.setUserFriendly(true);
            throw exception;
        }
    }

    return new Graph(logEvents);
}