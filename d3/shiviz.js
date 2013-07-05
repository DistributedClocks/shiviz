/**
 * Node class
 */
function Node(log, hostId, clock, line) {
  this.log = log;
  this.hostId = hostId;
  this.clock = clock;
  this.time = clock[hostId];
  this.index = -1;

  this.parents = {};
  this.children = {};

  this.syntheticParents = {};
  this.syntheticChildren = {};
 
  this.line = line || 0;

/*
  this.collapsible = false;
  this.collapsedTarget = null;
  this.collapsedChildren = [];
  this.collapsedParent = null;
  this.collapseToggleOn = true;*/
}

Node.prototype.getLine = function() {
  return this.line;
}

Node.prototype.id = function() {
  return this.hostId + ":" + this.time;
}

Node.prototype.getClock = function() {
  return this.clock;
}

Node.prototype.getHostId = function() {
  return this.hostId;
}

Node.prototype.getTime = function() {
  return this.time;
}

Node.prototype.getLog = function() {
  return this.log;
}

Node.prototype.setIndex = function(index) {
  this.index = index;
}

Node.prototype.getIndex = function() {
  return this.index;
}

Node.prototype.addChild = function(child) {
  this.children[child.getHostId()] = child;
}

Node.prototype.addParent = function(p) {
  this.parents[p.getHostId()] = p;
}

Node.prototype.getChildren = function() {
  return this.children;
}

Node.prototype.getParents = function() {
  return this.parents;
}

Node.prototype.addSynChild = function(child) {
  var host = child.getHostId();
  if (!this.syntheticChildren.hasOwnProperty(host) ||
      this.syntheticChildren[host].getTime() > child.getTime()) {
    this.syntheticChildren[host] = child;
  }
}

Node.prototype.addSynParent = function(p) {
  var host = p.getHostId();
  if (!this.syntheticParents.hasOwnProperty(host) ||
      this.syntheticParents[host].getTime() < p.getTime()) {
    this.syntheticParents[host] = p;
  }
}

Node.prototype.getSynChildren = function() {
  return this.syntheticChildren;
}

Node.prototype.getSynParents = function() {
  return this.syntheticParents;
}

Node.prototype.clearLayoutState = function() {
  this.syntheticChildren = {};
  for (var host in this.children) {
    this.syntheticChildren[host] = this.children[host];
  }
  this.syntheticParents = {};
  for (var host in this.parents) {
    this.syntheticParents[host] = this.parents[host];
  }

  this.index = -1;
}
/*
Node.prototype.getCollapsedTarget = function() {
  return this.collapsedTarget;
}

Node.prototype.isCollapsed = function() {
  return this.collapsible && this.collapseToggleOn;
}

Node.prototype.addCollapsedChild = function(child, target) {
  if (this.collapsible) {
    this.collapsedParent.addCollapsedChild(child, target);
  } else {
    this.collapsedChildren.push(child);
    this.collapsedTarget = target;
  }
}

Node.prototype.getCollapsedChildren = function() {
  return this.collapsedChildren;
}

Node.prototype.assignCollapsible = function(nodes) {
  if (this.getTime() <= 1) {
    this.collapsible = false;
    return;
  }

  for (var p in this.parents) {
    if (p != this.getHostId()) {
      this.collapsible = false;
      return;
    }
  }
  
  for (var c in this.children) {
    if (c != this.getHostId()) {
      this.collapsible = false;
      return;
    }
  }

  // Yes collapsible!
  this.collapsedParent = this.parents[this.hostId];
  var c = null;
  if (this.children.hasOwnProperty(this.hostId)) {
    c = this.children[this.hostId];
  }
  this.collapsedParent.addCollapsedChild(this, c);

  this.collapsible = true;
}*/

/**
 * Edge class
 */
function Edge(src, dest) {
  this.src = src;
  this.dest = dest;
}

Edge.prototype.getSrc = function() {
  return this.src;
}

Edge.prototype.getDest = function() {
  return this.dest;
}

function Edges() {}

Edges.prototype.toLiteral = function(hiddenHosts, nodes) {
  for (var i = 0; i < hiddenHosts.length; i++) {
    var hiddenHost = hiddenHosts[i];
    var curNode = nodes.get(hiddenHost, 0);

    while (curNode != null) {
      var parents = curNode.getSynParents();
      var children = curNode.getSynChildren();

      for (var parentHost in parents) {
        var parentNode = parents[parentHost];
        for (var childHost in children) {
          var childNode = children[childHost];
          parentNode.addSynChild(childNode);
          childNode.addSynParent(parentNode);
        }
      }
      curNode = nodes.getNext(hiddenHost, curNode.getTime() + 1);
    }
  }

  var literal = [];
  var hosts = nodes.getHosts();
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    if (hiddenHosts.indexOf(host) > -1) {
      continue;
    }

    var curNode = nodes.get(host, 0);
    while (curNode != null) {
/*      if (curNode.isCollapsed()) {
        curNode = nodes.getNext(host, curNode.getTime() + 1);
        continue;
      }*/
      var children = curNode.getSynChildren();
      for (var otherHost in children) {
        if (hiddenHosts.indexOf(otherHost) > -1) {
          continue;
        }

        var child = nodes.get(otherHost, children[otherHost].getTime());
/*        if (child.isCollapsed()) {
          child = curNode.getCollapsedTarget();
        } */

        if (child != null) {
          var edge = {};
          edge["source"] = curNode.getIndex();
          edge["target"] = child.getIndex();
          literal.push(edge);
        }
      }
      curNode = nodes.getNext(host, curNode.getTime() + 1);
    }
  }
  return literal;
}

/**
 * Graph class
 */
function Graph() {
  this.nodes = new Nodes();
  this.edges = new Edges();
  this.hasEdges = false;
}

Graph.prototype.parseLog = function(logLines) {
  if (this.hasEdges) {
    console.log("error, cannot parse log, edges already generated");
    return;
  }

  // assumes log lines come in pairs of log, timestamp
  // and that timestamp format is hostId {hostId_1:time_1, ... ,
  // hostId_n:time_n}

  if (logLines.length <= 1) {
    alert("No logs to display :(");
    return false;
  }

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
      
/*      var index = log.indexOf("INFO");
      if (index == -1) {
        index = log.indexOf("WARN");
      }
      var displayLog = log.substring(index + 4);
      this.nodes.add(new Node(displayLog, host, clock));
    */
      this.nodes.add(new Node(log, host, clock, i));
    }
  }catch (err) {
    alert("Error parsing input, malformed logs: " + i);
    clearText();
    return false;
  }

//  this.generateEdges();
//  this.nodes.computeCollapsible();
  return true;
}

Graph.prototype.toLiteral = function(hiddenHosts) {
  if (!this.hasEdges) {
    console.log("error, cannot return literal -- edges not generated"); 
    return {}; 
  }
  hiddenHosts = hiddenHosts || [];

  var literal = {};
  literal["nodes"] = this.nodes.toLiteral(hiddenHosts);
  literal["links"] = this.edges.toLiteral(hiddenHosts, this.nodes);
 
  var sortedHosts = this.nodes.getSortedHosts();
  for (var i = 0; i < hiddenHosts.length; i++) {
    sortedHosts.splice(sortedHosts.indexOf(hiddenHosts[i]), 1);
  }
  literal["hosts"] = sortedHosts; 
  return literal;
}

Graph.prototype.generateEdges = function() {
  if (this.hasEdges) {
    console.log("error, edges should not be generated twice");
    return;
  }
  this.hasEdges = true;

  var hosts = this.nodes.getHosts();
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    //var name = "Host: " + host.substring(host.indexOf("[") + 1, host.indexOf("]"));
    var name = "Host: " + host;
    var startClock = {};
    startClock[host] = 0;
    var startNode = new Node(name, host, startClock);
    this.nodes.add(startNode);
  }

  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    var clock = {};
    var curNode = this.nodes.get(host, 0);
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
          var candidate = this.nodes.get(otherHost, time);
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
      curNode = this.nodes.getNext(host, curNode.getTime() + 1);
    }
  }
  return this;
}

/**
 * Nodes container
 */
function Nodes() {
  this.hosts = {};
}

Nodes.prototype.toLiteral = function(hiddenHosts) {
  var literal = [];
  var index = 0;
  for (var host in this.hosts) {
    var curNode = this.get(host, 0);
    while (curNode != null) {
      curNode.clearLayoutState();
      curNode = this.get(host, curNode.getTime() + 1);
    }
  }
  for (var host in this.hosts) {
    if (hiddenHosts.indexOf(host) >= 0) {
      continue;
    }
    var arr = this.hosts[host]['times'];
    for (var i = 0; i < arr.length; i++) {
      var obj = this.get(host, arr[i]);
/*      if (obj.isCollapsed()) {
        continue;
      }*/
      var node = {};
      node["name"] = obj.getLog();
      node["group"] = host;
      if (obj.getTime() == 0) {
        node["startNode"] = true;
      }
      node["line"] = obj.getLine();
      obj.setIndex(index);
      index += 1;
      literal.push(node);
    }
  }
  return literal;
}

/*
Nodes.prototype.computeCollapsible = function() {
  for (var host in this.hosts) {
    var arr = this.hosts[host]['times'];
    for (var i = 0; i < arr.length; i++) {
      this.get(host, arr[i]).assignCollapsible(this);
    }
  }
}*/

Nodes.prototype.get = function(hostId, time) {
  var node = this.hosts[hostId][time];
  if (node === undefined) {
    return null;
  }
  return node;
}

Nodes.prototype.getNext = function(hostId, startTime) {
  var candidate = this.get(hostId, startTime);

  if (candidate == null) {
    var arr = this.hosts[hostId]['times'];
    if (!this.hosts[hostId]['sorted']) {
      this.hosts[hostId]['sorted'] = true;
      arr.sort();
    }
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > startTime) {
        return this.get(hostId, arr[i]);
      }
    }
  }
  return candidate;
}

Nodes.prototype.add = function(node) {
  var hostId = node.getHostId();
  var time = node.getTime();
  if (!this.hosts.hasOwnProperty(hostId)) {
    this.hosts[hostId] = {};
    this.hosts[hostId]['times'] = [];
  }
  this.hosts[hostId][time] = node;
  this.hosts[hostId]['times'].push(time);
  this.hosts[hostId]['sorted'] = false;
}

Nodes.prototype.getSortedHosts = function () {
  /* var hostCopy = this.hosts;
  return this.getHosts().sort(function(a, b) {
    return hostCopy[b]['times'].length - hostCopy[a]['times'].length;
  });*/
  return this.getHosts();
}

Nodes.prototype.getHosts = function() {
  return Object.keys(this.hosts);
}

var get = function (id) {
  return document.getElementById(id);
};

var devMode = false;

spaceTimeLayout = function () {
  var spaceTime = {},
      nodes = [],
      links = [],
      width = 760,
      height = 0,
      hosts = [];

  spaceTime.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = x;
    return spaceTime;
  };

  spaceTime.links = function (x) {
    if (!arguments.length) return links;
    links = x;
    return spaceTime;
  };

  spaceTime.width = function (x) {
    if (!arguments.length) return width;
    width = x;
    return spaceTime;
  };

  spaceTime.height = function (x) {
    if (!arguments.length) return height;
    height = x;
    return spaceTime;
  };

  spaceTime.hosts = function (x) {
    if (!arguments.length) return hosts;
    hosts = x;
    return spaceTime;
  };

  spaceTime.start = function () {

    // This is the amount of vertical spacing between nodes
    var delta = 45;

    var n = nodes.length,
        m = links.length,
        o;

    // Assign each node an index
    for (i = 0; i < n; ++i) {
      o = nodes[i];
      o.index = i;
      o.y = delta;
      o.children = [];
      o.parents = 0;
    }

    // All vertical positions are initialized to delta 
    height = delta;

    // Give each link the source/target node objects based on indices computed
    // above
    for (i = 0; i < m; ++i) {
      o = links[i];
      if (typeof o.source == "number") o.source = nodes[o.source];
      if (typeof o.target == "number") o.target = nodes[o.target];
      o.source.children.push(o.target);
      o.target.parents++;
    }

    // Going to want to sort the nodes by increasing number of parents and put
    // them in a priority queue
    var remainingNodes = [];

    for (i = 0; i < n; ++i) {
      remainingNodes.push(nodes[i]);
    }

    while (remainingNodes.length > 0) {
      remainingNodes.sort(function(a, b) {
        return b.parents - a.parents;
      });

      o = remainingNodes.pop();

      horizontalPos = width / hosts.length * hosts.indexOf(o.group) + (width / hosts.length / 2);
      o.x = horizontalPos;
      for (i = 0; i < o.children.length; ++i) { 
        o.children[i].parents--;
        // Increment child position by delta
        if (o.y + delta > o.children[i].y) {
          o.children[i].y = o.y + delta;
          height = Math.max(height, o.y + delta);
        }
      }
    }

    height += delta;

    return spaceTime;
  };

  return spaceTime;
};

function clearText() {
  get("logField").value = "";
  get("logField").disabled = false;
  get("vizButton").disabled = false;
  get("curNode").innerHTML = "(click to view)"

  get("graph").hidden = true;
  d3.selectAll("svg").remove();
}

get("clearButton").onclick = function() {
  clearText();
}

var spaceGraph;
var collapsedNodes;
var hiddenHosts;
var hostColors;

get("vizButton").onclick = function() {
  var textBox = get("logField");
  var lines = textBox.value.split('\n');

  // Initialize state 
  spaceGraph = new Graph();
  collapsedNodes = [];
  hiddenHosts = [];
  hostColors = {};

  if (!spaceGraph.parseLog(lines)) {
    // TODO: display error message
    return;
  }

  get("logField").disabled=true;
  get("vizButton").disabled=true;
  get("graph").hidden = false;

  var graphObj = spaceGraph.generateEdges().toLiteral();

  var color = d3.scale.category20();
  for (var i = 0; i < graphObj.hosts.length; i++) {
    var host = graphObj.hosts[i];
    hostColors[host] = color(host);
  }
  draw(graphObj);
};

function makeArrow() {
  var width = 40;
  var height = 200;
  var svg = d3.select("#sideBar").append("svg");

  // Draw time arrow with label
  var x = width - 20;
  var y1 = 85;
  var y2 = height - 30;
  svg.append("line")
    .attr("class", "time")
    .attr("x1", x).attr("y1", y1 + 15)
    .attr("x2", x).attr("y2", y2)
    .style("stroke-width", 3);

  svg.append("path")
    .attr("class", "time")
    .attr("d", "M " + (x - 5) + " " + y2 + 
        " L " + (x + 5) + " " + y2 + 
        " L " + x + " " + (y2 + 10) + " z");

  svg.append("text")
    .attr("class", "time")
    .attr("x", x - 20).attr("y", y1 - 5)
    .text("Time");

  svg.attr("width", width);
  svg.attr("height", height);
}

/* Draws hosts down. */
function drawHostsDown(label, subtext, hosts, svg) {
  var x = 0;
  var y = 65;

  var text = svg.append("text")
    .attr("class", "time")
    .attr("x", x).attr("y", y)
    .text(label);

  text.append("title").text(subtext);

  y += 15;

  var xDelta = 5;
  x = xDelta;

  var count = 0;

  var rect = svg.selectAll()
      .data(hosts)
      .enter().append("rect")
      .on("dblclick", function(e) { unhide(e); })
      .on("mouseover", function(e) { get("curNode").innerHTML = e; })
      .style("stroke", "#fff")
      .attr("width", 25).attr("height", 25)
      .style("fill", function(host) { return hostColors[host]; })
      .attr("y", function(host) {
        if (count == 3) {
          y += 30;
          count = 0;
        }
        count += 1;
        return y;
      })
      .attr("x", function(host) {
        var curX = x;
        x += 30;
        if (x > 65) {
          x = xDelta;
        }
        return curX;
      });

  rect.append("title").text(subtext);
}

/* Draws hosts across. */
function drawHostsAcross(label, subtext, hosts, svg) {
  var x = 0;
  var y = 15;

  var text = svg.append("text")
    .attr("class", "time")
    .attr("x", x).attr("y", y)
    .text(label);

  text.append("title").text(subtext);

  y += 5;

  var xDelta = 0;
  x = xDelta;

  var count = 0;

  var rect = svg.selectAll()
      .data(hosts)
      .enter().append("rect")
      .on("dblclick", function(e) { unhide(e); })
      .style("stroke", "#fff")
      .attr("width", 25).attr("height", 25)
      .style("fill", function(host) { return hostColors[host]; })
      .attr("y", function(host) {
        if (count == 38) {
          y += 30;
          count = 0;
        }
        count += 1;
        return y;
      })
      .attr("x", function(host) {
        var curX = x;
        x += 30;
        if (x > 760) {
          x = xDelta;
        }
        return curX;
      });

  rect.append("title").text(subtext);
}


function makeSideBar(hosts) {
  makeArrow();

  var width = 120;
  var height = 500;

  var svg = d3.select("#hosts").append("svg");

  // Draw the hidden host nodes
  if (hiddenHosts.length > 0) {
    drawHostsDown("Hidden hosts:", "Double click to view", hiddenHosts, svg);
  } 

  svg.attr("width", width);
  svg.attr("height", height);
}

function graph(graph) {
  var spaceTime = spaceTimeLayout();

  spaceTime
      .hosts(graph.hosts)
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  var svg = d3.select("#vizContainer").append("svg");


  var delta = 45;

  var link = svg.selectAll(".link")
      .data(graph.links)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return 1; });

  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { 
        if (d.source.hasOwnProperty("startNode") &&
            d.source.x != d.target.x) {
          return d.source.y + 10 - delta;   
        }
        return d.source.y - delta;
      })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y - delta; });

  var node = svg.selectAll(".node")
    .data(graph.nodes).enter().append("g");

  node.append("title")
      .text(function(d) { return d.name; });

  var standardNodes = node.filter(function(d) {
    return !d.hasOwnProperty("startNode");
  });

  standardNodes.append("circle")
    .on("mouseover", function(e) { get("curNode").innerHTML = e.name; })
    .on("click", function(e) { showLog(e); })
    .attr("class", "node")
    .style("fill", function(d) { return hostColors[d.group]; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y - delta; })
    .attr("r", function(d) { return 5; });

  var startNodes = node.filter(function(d) {
    return d.hasOwnProperty("startNode");
  });

  svg.attr("height", spaceTime.height());
  svg.attr("width", spaceTime.width());

  var starts = graph.nodes.filter(function(d) { 
      return d.hasOwnProperty("startNode"); });
  var hostSvg = d3.select("#hostBar").append("svg");

  hostSvg.append("rect")
    .style("stroke", "#fff")
    .attr("width", 760).attr("height", 60)
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", "#fff");

  hostSvg.selectAll().data(starts).enter()
    .append("rect")
    .style("stroke", "#fff")
    .attr("width", 25).attr("height", 25)
    .attr("x", function(d) { return d.x - (25/2); })
    .attr("y", function(d) { return 15; })
    .on("mouseover", function(e) { get("curNode").innerHTML = e.name; })
    .on("dblclick", function(e) { hideHost(e); })
    .attr("class", "node")
    .style("fill", function(d) { return hostColors[d.group]; });

  hostSvg.attr("width", 760);
  hostSvg.attr("height", 55);
}


function draw(graphObj) {
  graphObj = graphObj || spaceGraph.toLiteral(hiddenHosts);
  d3.selectAll("svg").remove();
  graph(graphObj);
  makeSideBar(graphObj.hosts);
}

function showLog(e) {
  selectTextareaLine(get("logField"), e.line); 
}

function hideHost(e) {
  hiddenHosts.push(e.group);
  draw();
}

function unhide(e) {
  var index = hiddenHosts.indexOf(e);
  hiddenHosts.splice(index, 1);
  draw();
}

function loadExample(filename) {
  var file = 'http://www.corsproxy.com/bestchai.bitbucket.org/shiviz/' + filename;
  $.get(file, function(response) {
    get("logField").value = response;
  });
}

window.onscroll=function () {
    var top = window.pageXOffset ? window.pageXOffset : document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;
    if(top > 630){
        get("topBar").style.position = "fixed";
        get("topBar").style.top="0px";

        // Time flow div.
        get("sideBar").style.position = "fixed";
        get("sideBar").style.top="85px";

        // Hidden hosts div
        get("hosts").style.position = "fixed";
        get("hosts").style.top="85px";
        get("hosts").style.marginLeft="800px";
        
        get("hostBar").style.position = "fixed";
        get("hostBar").style.top= "50px";
        get("hostBar").style.marginLeft="40px";

        get("vizContainer").style.marginLeft="40px";
    } else {
        get("topBar").style.position = "relative";
        get("sideBar").style.position = "relative";

        get("hosts").style.position = "relative";
        get("hosts").style.marginLeft="0px";
        get("hosts").style.top="0px";

        get("hostBar").style.position = "relative";
        get("hostBar").style.marginLeft="0px";
        get("hostBar").style.top= "0px";

        get("vizContainer").style.marginLeft = "0px";
    }
}

function selectTextareaLine(tarea,lineNum) {
    var lineLength = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".length;

    var lines = tarea.value.split("\n");

    var numLines = 0;
    // calculate start/end
    var startPos = 0, endPos = tarea.value.length;
    for(var x = 0; x < lines.length; x++) {
        if(x == lineNum) {
            break;
        }
        startPos += (lines[x].length+1);
        
        numLines += Math.ceil(lines[x].length / lineLength);
    }

    tarea.scrollTop = numLines * 13 - 20;
    var endPos = lines[lineNum].length+startPos;

    // do selection
    // Chrome / Firefox

    if(typeof(tarea.selectionStart) != "undefined") {
        tarea.focus();
        tarea.selectionStart = startPos;
        tarea.selectionEnd = endPos;
        return true;
    }

    // IE
    if (document.selection && document.selection.createRange) {
        tarea.focus();
        tarea.select();
        var range = document.selection.createRange();
        range.collapse(true);
        range.moveEnd("character", endPos);
        range.moveStart("character", startPos);
        range.select();
        return true;
    }

    return false;
}
