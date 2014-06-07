/**
 * A View for some ShiViz graphs. A View knows how to draw itself. A view
 * accepts an initial model in construction and collects Tranformations that
 * generate new iterations of the initial model.
 */
function View(model, global) {
    this.initialModel = model;
    this.currentModel = model;
    this.currentVisualModel = null;

    this.transformations = [];

    this.global = global;
    this.hiddenHosts = global.hiddenHosts;
    this.hostColors = global.hostColors;

    var numHosts = this.currentModel.getHosts().length;
    var width = Math.max(numHosts * 40, $("body").width() * numHosts
            / (this.global.hosts.length + this.global.views.length - 1));
    
    var layout = new SpaceTimeLayout(width, 45);
    this.currentVisualModel = new VisualGraph(this.currentModel, layout,
            this.hostColors);
    
    this.addTransformation(new CollapseSequentialNodesTransformation(2));
}

/**
 * Called during construction to ensure that all hosts in the initial model have
 * a stable color throughout iterations of this View. Uses d3 to assign a color
 * per host.
 */
View.prototype.setColors = function() {
    var hosts = this.global.hosts;
    var color = d3.scale.category20();
    for ( var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        this.hostColors[host] = color(host);
    }
};

/**
 * returns an array of key value pairs with host being the key and the value
 * being its color
 */
View.prototype.getHostColors = function() {
    return this.hostColors;
};

/**
 * Adds the given Transformation to this View's (ordered) collection of
 * Transformations and uses it to update the currentModel.
 */
View.prototype.addTransformation = function(transformation) {
    this.global.transformations.push(transformation);
    this.global.applyTransformations();
};

/**
 * Hides the given host by initiating TransitiveEdges and HideHost
 * transformations.
 */
View.prototype.hideHost = function(hostId) {
    this.hiddenHosts.push(hostId);
    this.addTransformation(new HideHostTransformation(hostId));
    this.global.drawAll();
};

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
    this.global.applyTransformations();
    this.global.drawAll();
};

/**
 * Finds and removes the hiding transformations for the given host from this
 * View's collection of Transformations.
 * 
 * TODO: As noted above, this logic should be moved into an additional
 * Transformation.
 */
View.prototype.removeHidingTransformations = function(hostId) {
    var length = this.global.transformations.length;
    for ( var i = 0; i < length; i++) {
        var t = this.global.transformations[i];
        if (t.hasOwnProperty('hostToHide') && t.hostToHide == hostId) {
            continue;
        }
        this.global.transformations.push(t);
    }
    this.global.transformations.splice(0, length);
};

/**
 * Applies all transformations in the current collection to the initial model
 * and updates the current model.
 */
View.prototype.applyTransformations = function() {
    this.currentModel = this.initialModel.clone();
    
    var numHosts = this.currentModel.getHosts().length;
    var width = Math.max(numHosts * 40, $("body").width() * numHosts
            / (this.global.hosts.length + this.global.views.length - 1));
    
    var layout = new SpaceTimeLayout(width, 45);
    
    this.currentVisualModel = new VisualGraph(this.currentModel, layout,
            this.hostColors);
    
    for ( var i = 0; i < this.global.transformations.length; i++) {
        var t = this.global.transformations[this.global.transformations.length - i - 1]; // TODO: CHANGE
        t.transform(this.currentModel, this.currentVisualModel);
    }
};

/**
 * Clears the current visualization and re-draws the current model.
 */
View.prototype.draw = function() {
    // Assign a unique ID to each execution so we can distinguish
    // them
    if (this.id == null)
        this.id = "view" + d3.selectAll("#vizContainer > svg").size();


    var visualGraph = this.currentVisualModel;
    var delta = 45;

    // Define locally so that we can use in lambdas below
    var view = this;

    var svg = d3.select("#vizContainer").append("svg");

    // Remove old diagrams, but only the ones with the same ID
    // so we don't remove the other executions
    d3.selectAll("." + this.id).remove();
    d3.selectAll("#hosts svg").remove();

    var link = svg.selectAll(".link").data(visualGraph.getVisualEdges())
            .enter().append("line").attr("class", "link").style("stroke-width",
                    function(d) {
                        return d.getWidth();
                    });

    link.attr("x1", function(d) {
        return d.getSourceVisualNode().getX();
    }).attr("y1", function(d) {
        return d.getSourceVisualNode().getY();
    }).attr("x2", function(d) {
        return d.getTargetVisualNode().getX();
    }).attr("y2", function(d) {
        return d.getTargetVisualNode().getY();
    }).style("stroke-dasharray", function(d) {
        return d.getDashLength() + "," + d.getDashLength();
    });

    var node = svg.selectAll(".node").data(visualGraph.getVisualNodes())
            .enter().append("g").attr("transform", function(d) {
                return "translate(" + d.getX() + "," + d.getY() + ")";
            });

    node.append("title").text(function(d) {
        return d.getText();
    });

    var standardNodes = node.filter(function(d) {
        return !d.isStart();
    });

    standardNodes.append("circle").on("mouseover", function(e) {
        $("#curNode").text(e.getText());
    }).on("click", function(e) {
        selectTextareaLine($("#logField")[0], e.getLine());
    }).attr("class", "node").style("fill", function(d) {
        return d.getFillColor();
    }).attr("id", function(d) {
        return d.getHost();
    }).attr("cx", function(d) {
        return 0;
    }).attr("cy", function(d) {
        return 0;
    }).attr("r", function(d) {
        return d.getRadius();
    });

    standardNodes.append("text").attr("text-anchor", "middle").text(
            function(d) {
                return d.getLabel();
            });

    svg.attr("height", visualGraph.getHeight()).attr("width", visualGraph.getWidth())
            .attr("class", this.id);

    var starts = visualGraph.getVisualNodes().filter(function(d) {
        return d.isStart();
    });
    var hostSvg = d3.select("#hostBar").append("svg");

    hostSvg.append("rect").style("stroke", "#fff").attr("width",
            visualGraph.getWidth()).attr("height", 60).attr("x", 0).attr("y", 0)
            .style("fill", "#fff");

    hostSvg.selectAll().data(starts).enter().append("rect").style("stroke",
            "#fff").attr("width", 25).attr("height", 25).attr("x", function(d) {
        return d.getX() - (25 / 2);
    }).attr("y", function(d) {
        return 15;
    }).on("mouseover", function(e) {
        $("#curNode").text(e.getText());
    }).attr("id", function(d) {
        return d.group;
    }).on("dblclick", function(e) {
        view.hideHost(e.getHost());
    }).attr("class", "node").style("fill", function(d) {
        return d.getFillColor();
    });

    hostSvg.attr("width", visualGraph.getWidth()).attr("height", 55).attr("class",
            this.id);

    this.drawArrow();
    this.drawHiddenHosts();
};

/**
 * Draws the time arrow.
 */
View.prototype.drawArrow = function() {
    var width = 40;
    var height = 200;
    var sideBar = d3.select("#sideBar");

    // Don't draw the arrow twice
    if (sideBar.selectAll("svg").size())
        return;

    var svg = sideBar.append("svg");
    svg.attr("width", width);
    svg.attr("height", height);

    // Draw time arrow with label
    var x = width / 2;
    var y1 = 85;
    var y2 = height - 30;

    svg.append("line").attr("class", "time").attr("x1", x).attr("y1", y1 + 15)
            .attr("x2", x).attr("y2", y2).style("stroke-width", 3);

    svg.append("path").attr("class", "time").attr(
            "d",
            "M " + (x - 5) + " " + y2 + " L " + (x + 5) + " " + y2 + " L " + x
                    + " " + (y2 + 10) + " z");

    svg.append("text").attr("class", "time").attr("x", x - 20)
            .attr("y", y1 - 5).text("Time");
};

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

    var text = svg.append("text").attr("class", "time").attr("x", x).attr("y",
            y).text("Hidden hosts:");

    y += 15;
    var xDelta = 5;
    x = xDelta;
    var count = 0;

    var rect = svg.selectAll().data(this.hiddenHosts).enter().append("rect")
            .on("dblclick", function(e) {
                view.unhideHost(e);
            }).on("mouseover", function(e) {
                $("#curNode").innerHTML = e;
            }).style("stroke", "#fff").attr("width", 25).attr("height", 25)
            .style("fill", function(host) {
                return view.hostColors[host];
            }).attr("y", function(host) {
                if (count == 3) {
                    y += 30;
                    count = 0;
                }
                count += 1;
                return y;
            }).attr("x", function(host) {
                var curX = x;
                x += 30;
                if (x > 65) {
                    x = xDelta;
                }
                return curX;
            });

    text.append("title").text("Double click to view");
    rect.append("title").text("Double click to view");
};
