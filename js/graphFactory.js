/**
 * Generates and returns a model from log lines. 
 * logLines is an array of alternating log event, vector timestamp pairs.
 * Assumes timestamps are in the format
 * 'localHostId {hostId_1:time_1, ..., hostId_n:time_n}'
 */
function generateGraphFromLog(logLines, regex) {

  // TODO: fail gracefully

  if (logLines.length <= 1) {
    alert("No logs to display :(");
    return false;
  }
  
  var myRegexes = parseRegexes(regex);

  model = new Graph();

  var i = 0;
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
      
      var data = parseLogText(log, myRegexes);

      model.addNode(new Node(log + " " + JSON.stringify(data), host, clock, i, data));
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
 * MyRegex class.
 * @param string	The javascript regex engine compatible regex in string form
 * @param groupNumToName	Mapping of numbered capture groups to their names.
 * @returns	instance of MyRegex
 */
function MyRegex(string, groupNumToName) {
	  this.string = string;
	  this.groupNumToName = groupNumToName;
}

/**
 * Parses regex from raw textfield input. Each regex must be entered on its own line.
 * This function abstracts away named capture groups into numbered groups and a mapping of
 * numbers to names. This function does not check if the regexes are correct or not.
 * @param regex	The raw textfield input
 * @returns {Array}	An array of MyRegex objects.
 */
function parseRegexes(regex) {
	// if no regex entered, provide default one that captures everything
	if(regex.trim().length == 0) {
		regex = "(?<text>.*)";
	}
	
	var ret = [];
	var regexArray = regex.split("\n");
	for(var i = 0; i < regexArray.length; i++) {
		var captureGroupStart = /\(\?<(.+?)>/g;
		var groupNumToName = [];
		var match = null;
		while((match = captureGroupStart.exec(regex)) != null) {
			groupNumToName.push(match[1]);
		}
		
		var nonCaptureGroupStart = /\((?!\?)/g;
		regex = regex.replace(nonCaptureGroupStart, "(?:").replace(captureGroupStart, "(");

		ret.push(new MyRegex(regex, groupNumToName));
	}
	
	return ret;
}

/**
 * Extracts data from log text. The first regex in Regexes that matches text is used.
 * @param text	The string on which we perform regex searches
 * @param myRegexes	Array of MyRegex.
 * @returns	An Object of key-value pairs of data extracted from log text. object[x] == y such 
 * that y is the value associated with capture group x. 
 * "Default" capture groups are included. (e.g. object["text"] = full text of the log).
 * "Default" capture groups are included even if none of the provided regexes match
 */
function parseLogText(text, myRegexes) {
	var ret = {};
	ret["text"] = text;
	
	for(var i = 0; i < myRegexes.length; i++) {
		var currentRegex = new RegExp(myRegexes[i].string);
		var execResult = currentRegex.exec(text);
		if(execResult == null) continue;
		
		ret["matchedText"] = execResult[0];
		for(var j = 1; j < execResult.length; j++) {
			ret[myRegexes[i].groupNumToName[j-1]] = execResult[j];
		}
		break;
	}
	
	return ret;
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
