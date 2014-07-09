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
        catch(err) {
            var exception = new Exception("An error occured trying to parse this vector timestamp on line " + (i + 1) + ":\n");
            exception.append(stamp.substring(spacer), "code");
            exception.append("\n\nThe error message from the JSON parser reads:\n");
            exception.append(err.toString(), "italic");
            exception.setUserFriendly(true);
            throw exception;
        }
        
        try{
            var vt = new VectorTimestamp(clock, host);

            logEvents.push(new LogEvent(log, host, vt, i));
        }
        catch(exception) {
            exception.prepend("An error occured while trying to parse the following vector timestamp. ");
            exception.append(stamp.substring(spacer), "code");
            exception.setUserFriendly(true);
            throw exception;
        }
    }
    
    return new Graph(logEvents);

}
