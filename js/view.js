/**
 * A View for some ShiViz graphs. A View knows how to draw itself. A view
 * accepts an initial model in construction and collects Transformations that
 * generate new iterations of the initial model.
 */
function View(model, global) {
    this.initialModel = model;
    this.global = global;
    this.transformations = [];
    this.collapseSequentialNodesTransformation = new CollapseSequentialNodesTransformation(2);
    
    this.addTransformation(this.collapseSequentialNodesTransformation);
}

View.prototype.getGlobal = function() {
    return this.global;
};

View.prototype.addTransformation = function(transformation) {
    this.transformations.push(transformation);
    this.draw();
};


View.prototype.getHosts = function() {
    return this.initialModel.getHosts();
};



/**
 * Clears the current visualization and re-draws the current model.
 */
View.prototype.draw = function() {
    // Assign a unique ID to each execution so we can distinguish
    // them
    if (this.id == null)
        this.id = "view" + d3.selectAll("#vizContainer > svg").size();

    
    var currentModel = this.initialModel.clone();
    
    var numHosts = currentModel.getHosts().length;
    var width = Math.max(numHosts * 40, $("body").width() * numHosts
            / (this.global.hosts.length + this.global.views.length - 1));
    
    var layout = new SpaceTimeLayout(width, 45);
    
    var visualGraph = new VisualGraph(currentModel, layout,
            this.global.hostColors);
    
    var transformations = this.global.getTransformations().concat(this.transformations);
    transformations.sort(function(a, b) {
        return b.priority - a.priority;
    });
    
    for ( var i = 0; i < transformations.length; i++) {
        transformations[i].transform(visualGraph);
    }


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
    
    node.on("click", function(e) {
        if(d3.event.ctrlKey) {
            view.collapseSequentialNodesTransformation.toggleExemption(e.getNode());
            view.global.drawAll();
        }
        else {
            selectTextareaLine($("#logField")[0], e.getLineNumber());
        }
        
    });

    var standardNodes = node.filter(function(d) {
        return !d.isStart();
    });

    standardNodes.append("circle").on("mouseover", function(e) {
        $("#curNode").text(e.getText());
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
        view.global.hideHost(e.getHost());
    }).attr("class", "node").style("fill", function(d) {
        return d.getFillColor();
    });

    hostSvg.attr("width", visualGraph.getWidth()).attr("height", 55).attr("class",
            this.id);
};




