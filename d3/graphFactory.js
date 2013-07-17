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

      model.addNode(new Node(log, host, clock, i));
    }
  }catch (err) {
    alert("Error parsing input, malformed logs: " + i);
    resetView();
    return null;
  }

  generateEdges(model);

  return model;
}


/**
 * Generates an initial set of edges for the given model from each Node's vector
 * clock.
 */
function generateEdges (model) {
  var hosts = model.getHosts();
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    var name = "Host: " + host;
    var startClock = {};
    startClock[host] = 0;
    var startNode = new Node(name, host, startClock);
    model.addNode(startNode);
  }

  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    var clock = {};
    var curNode = model.getNode(host, 0);
    var prevNode = null;
    while (curNode != null) {
      if (prevNode != null) {
        // curNode has a parent on this host
        model.addEdge(prevNode, curNode);
      }
      clock[host] = curNode.time;
      var candidates = [];
      var curClock = curNode.clock;
      for (var otherHost in curClock) {
        var time = curClock[otherHost];
        if (!clock.hasOwnProperty(otherHost) || clock[otherHost] < time) {
          // This otherHost may be a parent
          clock[otherHost] = time;
          var candidate = model.getNode(otherHost, time);
          candidates.push(candidate);
        }
      }

      // Determine which of candidates are 'necessary'
      var sourceNodes = {}; 
      for (var j = 0; j < candidates.length; j++) {
        var candidate = candidates[j];
        sourceNodes[candidate.id()] = candidate;
      }

      for (var j = 0; j < candidates.length; j++) {
        canClock = candidates[j].clock;
        for (var otherHost in canClock) {
          if (otherHost != candidates[j].hostId) {
            var id = otherHost + ":" + canClock[otherHost];
            delete sourceNodes[id];
          }
        }
      }

      for (var id in sourceNodes) {
        model.addEdge(sourceNodes[id], curNode);
      }

      prevNode = curNode;
      curNode = model.getNextNode(host, curNode.time + 1);
    }
  }
  return model;
}
