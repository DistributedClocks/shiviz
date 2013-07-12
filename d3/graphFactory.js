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

  generateEdges(model);

  return model;
}


function generateEdges (model) {
  var hosts = model.nodes.getHosts();
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    var name = "Host: " + host;
    var startClock = {};
    startClock[host] = 0;
    var startNode = new Node(name, host, startClock);
    model.nodes.add(startNode);
  }

  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    var clock = {};
    var curNode = model.nodes.get(host, 0);
    var prevNode = null;
    while (curNode != null) {
      if (prevNode != null) {
        // curNode has a parent on this host
        prevNode.addChild(curNode);
        curNode.addParent(prevNode);
      }
      clock[host] = curNode.getTime();
      var candidates = [];
      var curClock = curNode.getClock();
      for (var otherHost in curClock) {
        var time = curClock[otherHost];
        if (!clock.hasOwnProperty(otherHost) || clock[otherHost] < time) {
          // This otherHost may be a parent
          clock[otherHost] = time;
          var candidate = model.nodes.get(otherHost, time);
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
        canClock = candidates[j].getClock();
        for (var otherHost in canClock) {
          if (otherHost != candidates[j].getHostId()) {
            var id = otherHost + ":" + canClock[otherHost];
            delete sourceNodes[id];
          }
        }
      }

      for (var id in sourceNodes) {
        sourceNodes[id].addChild(curNode);
        curNode.addParent(sourceNodes[id]);
      }

      prevNode = curNode;
      curNode = model.nodes.getNext(host, curNode.getTime() + 1);
    }
  }
  return model;
}
