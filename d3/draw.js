function makeModel(graph) {
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
    .on("click", function(e) { 
      selectTextareaLine(get("logField"), e.line); 
    })
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
    .on("dblclick", function(e) { 
      hiddenHosts.push(e.group);
      draw();
    })
    .attr("class", "node")
    .style("fill", function(d) { return hostColors[d.group]; });

  hostSvg.attr("width", 760);
  hostSvg.attr("height", 55);
}

function makeArrow() {
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

function drawHiddenHosts() {
  if (hiddenHosts.length <= 0) {
    return;
  }

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
      .data(hiddenHosts)
      .enter().append("rect")
      .on("dblclick", function(e) { 
        hiddenHosts.splice(hiddenHosts.indexOf(e), 1);
        draw();
      })
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

  text.append("title").text("Double click to view");
  rect.append("title").text("Double click to view");
}

