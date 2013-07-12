/**
 * Generates and returns a model from log lines. 
 * logLines is an array of alternating log event, vector timestamp pairs.
 * Assumes timestamps are in the format
 * 'localHostId {hostId_1:time_1, ..., hostId_n:time_n}'
 */
function generateGraphFromLog(logLines) {

  // TODO: fail gracefully

  if (logLines.length <= 1) {
    alert("No logs to display :(");
    return false;
  }

  model = new Graph();

  var i;
  try {
    for (i = 0; i < logLines.length; i+=2) {
      var log = logLines[i];
      if (log.length == 0) {
        i -= 1;
        continue;
      }
      var stamp = logLines[i+1];
      var spacer = stamp.indexOf(" ");
      var host = stamp.substring(0, spacer);
      var clock = JSON.parse(stamp.substring(spacer));
      
      model.nodes.add(new Node(log, host, clock, i));
    }
  }catch (err) {
    alert("Error parsing input, malformed logs: " + i);
    resetView();
    return null;
  }

  return model;
}


