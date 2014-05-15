/**
 * A View for some ShiViz graphs. A View knows how to draw itself. A view
 * accepts an initial model in construction and collects Tranformations that
 * generate new iterations of the initial model.
 */
function View(model) {
  this.initialModel = model;
  this.currentModel = model;
  this.transformations = [];
  this.hiddenHosts = [];
  this.hostColors = {};
  this.hosts = this.getHostId();
  
  this.setColors();
}

/**
 * Called during construction to ensure that all hosts in the initial model have
 * a stable color throughout iterations of this View. Uses d3 to assign a color
 * per host.
 */
View.prototype.setColors = function() {
  var hosts = this.initialModel.getHosts();
  var color = d3.scale.category20();
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    this.hostColors[host] = color(host);
  }
}

/**
 * returns an array of key value pairs with host 
 * being the key and the value being its color
 */
View.prototype.getHostColors = function() {
  return this.hostColors; 
}

/**
 * returns an array of ids of all the hosts 
 */
View.prototype.getHostId = function() {
  return this.initialModel.getHosts();
}

/**
 * gets the Id of the final node in each process
 */
View.prototype.getLastNodeId = function() {
	return this.initialModel.getLastNodeOfAllHosts();	
}

/**
 * Adds the given Transformation to this View's (ordered) collection of
 * Transformations and uses it to update the currentModel.
 */
View.prototype.addTransformation = function(transformation) {
  this.transformations.push(transformation);
  this.currentModel = transformation.transform(this.currentModel);
}

/**
 * Hides the given host by initiating TransitiveEdges and HideHost
 * transformations.
 */
View.prototype.hideHost = function(hostId) {
  this.hiddenHosts.push(hostId);
  this.addTransformation(new TransitiveEdgesTransformation(hostId));
  this.addTransformation(new HideHostTransformation(hostId));
  this.draw();
}

/**
 * Unhides the given host by removing the TransitiveEdges and HideHost
 * transformations from this View's collection. Then applys all remaining
 * transformations to the initial model.
 * 
 * TODO: This logic should really be an additional Transformation.
 */
View.prototype.unhideHost = function(hostId) {
  this.hiddenHosts.splice(this.hiddenHosts.indexOf(hostId), 1);
  this.removeHidingTransformations(hostId); 
  this.applyTransformations();
  this.draw();
}

/**
 * Finds and removes the hiding transformations for the given host from this
 * View's collection of Transformations.
 * 
 * TODO: As noted above, this logic should be moved into an additional
 * Transformation.
 */
View.prototype.removeHidingTransformations = function(hostId) {
  var trans = [];
  for (var i = 0; i < this.transformations.length; i++) {
    var t = this.transformations[i];
    if (t.hasOwnProperty('hostToHide') && t.hostToHide == hostId) {
      continue;
    }
    trans.push(t);
  }
  this.transformations = trans;
}

/**
 * Applies all transformations in the current collection to the initial model
 * and updates the current model.
 */
View.prototype.applyTransformations = function() {
  this.currentModel = this.initialModel;
  for (var i = 0; i < this.transformations.length; i++) {
    var t = this.transformations[i];
    this.currentModel = t.transform(this.currentModel);
  }
}

/**
 * Clears the current visualization and re-draws the current model.
 */
View.prototype.draw = function() {

  d3.selectAll("svg").remove();
  var graphLiteral = this.currentModel.toLiteral();

  // Define locally so that we can use in lambdas below
  var view = this;

  var spaceTime = spaceTimeLayout();

  spaceTime
      .hosts(graphLiteral.hosts)
      .nodes(graphLiteral.nodes)
      .links(graphLiteral.links)
      .start();

  var svg = d3.select("#vizContainer").append("svg");

  var delta = 45;

  var link = svg.selectAll(".link")
      .data(graphLiteral.links)
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
    .data(graphLiteral.nodes).enter().append("g");

  node.append("title")
      .text(function(d) { return d.name; });

  var standardNodes = node.filter(function(d) {
    return !d.hasOwnProperty("startNode");
  });

  standardNodes.append("circle")
    .on("mouseover", function(e) { get("curNode").innerHTML = e.name; })
    .on("click", function(e) { 
      selectTextareaLine(get("logField"), e.line); 
    })
    .attr("class", "node")
    .style("fill", function(d) { return view.hostColors[d.group]; })
    .attr("id", function(d) {return d.group;})
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y - delta; })
    .attr("r", function(d) { return 5; });

  var startNodes = node.filter(function(d) {
    return d.hasOwnProperty("startNode");
  });

  svg.attr("height", spaceTime.height());
  svg.attr("width", spaceTime.width());

  var starts = graphLiteral.nodes.filter(function(d) { 
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
    .attr("id", function(d) {return d.group;})
    .on("dblclick", function(e) { view.hideHost(e.group); })
    .attr("class", "node")
    .style("fill", function(d) { return view.hostColors[d.group]; });

  hostSvg.attr("width", 760);
  hostSvg.attr("height", 55);

  this.drawArrow();
  this.drawHiddenHosts();
}

/**
 * Draws the time arrow.
 */
View.prototype.drawArrow = function() {
  var width = 40;
  var height = 200;
  var svg = d3.select("#sideBar").append("svg");
  svg.attr("width", width);
  svg.attr("height", height);

  // Draw time arrow with label
  var x = width / 2;
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
}

/**
 * Draws the hidden hosts, if any exist.
 */
View.prototype.drawHiddenHosts = function() {
  if (this.hiddenHosts.length <= 0) {
    return;
  }

  // Define locally so that we can use in lambdas below
  var view = this;

  var svg = d3.select("#hosts").append("svg");
  svg.attr("width", 120);
  svg.attr("height", 500);

  var x = 0;
  var y = 65;

  var text = svg.append("text")
    .attr("class", "time")
    .attr("x", x).attr("y", y)
    .text("Hidden hosts:");

  y += 15;
  var xDelta = 5;
  x = xDelta;
  var count = 0;

  var rect = svg.selectAll()
      .data(this.hiddenHosts)
      .enter().append("rect")
      .on("dblclick", function(e) { view.unhideHost(e); })
      .on("mouseover", function(e) { get("curNode").innerHTML = e; })
      .style("stroke", "#fff")
      .attr("width", 25).attr("height", 25)
      .style("fill", function(host) { return view.hostColors[host]; })
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

  text.append("title").text("Double click to view");
  rect.append("title").text("Double click to view");
}
