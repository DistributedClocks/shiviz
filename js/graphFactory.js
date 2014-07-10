/**
 * Generates and returns a model from log lines. logLines is an array of
 * alternating log event, vector timestamp pairs. Assumes timestamps are in the
 * format 'localHostId {hostId_1:time_1, ..., hostId_n:time_n}'
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
            logEvents.push(new LogEvent(event, host, vt, ln));
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