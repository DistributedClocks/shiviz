/**
 * @class
 * A View for a ShiViz graph. A View is responsible for drawing a single VisualGraph. It also collects transformations that 
 * generate new iterations of the model.
 * 
 * @constructor
 * @param {Graph} model
 * @param {Global} global
 * @param {String} label
 */
function View(model, global, label) {
    
    /** @private */
    this.label = label;
    
    /** @private */
    this.initialModel = model;
    
    /** @private */
    this.global = global;
    
    /** @private */
    this.transformations = [];
    
    /** @private */
    this.width = 500;
    
    /** @private */
    this.collapseSequentialNodesTransformation = new CollapseSequentialNodesTransformation(2);
    
    this.addTransformation(this.collapseSequentialNodesTransformation);
}

/**
 * Gets the Global that this view belongs to
 * 
 * @returns {Global} The global that this view belongs to
 */
View.prototype.getGlobal = function() {
    return this.global;
};

/**
 * Adds a transformation. The transformation is not applied until the draw method is invoked.
 * The difference between view.addTransformation and global.addTransformation is that the global version
 * adds applies the transformation to all views.
 * 
 * @param {Transform} transformation The new transformation
 */
View.prototype.addTransformation = function(transformation) {
    this.transformations.push(transformation);
};

/**
 * Gets the hosts as an array
 * 
 * @returns {Array<String>} The hosts
 */
View.prototype.getHosts = function() {
    return this.initialModel.getHosts();
};

/**
 * Sets the width of this view
 * 
 * @param {newWidth} The new width
 */
View.prototype.setWidth = function(newWidth) {
    this.width = newWidth;
};


/**
 * Clears the current visualization and re-draws the current model.
 */
View.prototype.draw = function() {
    // Assign a unique ID to each execution so we can distinguish
    // them
    if (this.id == null) {
        this.id = "view" + d3.selectAll("#vizContainer > svg").size();
    }

    // Apply all transformations applied to this view an those applied to global
    var currentModel = this.initialModel.clone();
    var layout = new SpaceTimeLayout(this.width, 45);
    
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
    
    svg.attr("height", visualGraph.getHeight());
    svg.attr("width", visualGraph.getWidth());
    svg.attr("class", this.id);
    

    // draw links
    var link = svg.selectAll().data(visualGraph.getVisualEdges())
            .enter().append("line");
    
    link.style("stroke", "#999");
    link.style("stroke-opacity", 0.6);
    
    link.style("stroke-width",
                    function(d) {
                        return d.getWidth();
                    });

    link.attr("x1", function(d) {
        return d.getSourceVisualNode().getX();
    });
    
    link.attr("y1", function(d) {
        return d.getSourceVisualNode().getY();
    });
    
    link.attr("x2", function(d) {
        return d.getTargetVisualNode().getX();
    });
    
    link.attr("y2", function(d) {
        return d.getTargetVisualNode().getY();
    });
    
    link.style("stroke-dasharray", function(d) {
        return d.getDashLength() + "," + d.getDashLength();
    });

    // draw nodes
    
    var node = svg.selectAll().data(visualGraph.getNonStartVisualNodes())
            .enter().append("g");
    
    node.attr("transform", function(d) {
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

    var circle = node.append("circle");
    circle.on("mouseover", function(e) {
        $("#curNode").text(e.getText());
    });
    circle.style("fill", function(d) {
        return d.getFillColor();
    });
    circle.attr("id", function(d) {
        return d.getHost();
    });
    circle.attr("cx", function(d) {
        return 0;
    });
    circle.attr("cy", function(d) {
        return 0;
    });
    circle.attr("r", function(d) {
        return d.getRadius();
    });
    
    circle.style("stroke", "#fff");
    circle.style("stroke-width", "1.5px");
    
    
    var label = node.append("text");
    label.attr("text-anchor", "middle");
    label.attr("font-size", 10);
    label.attr("fill", "white");
    label.attr("dy", "0.35em");
    label.text(
            function(d) {
                return d.getLabel();
            });


    
    var hostSvg = d3.select("#hostBar").append("svg");
    hostSvg.attr("width", visualGraph.getWidth());
    hostSvg.attr("height", 55);
    hostSvg.attr("class", this.id);

    var bar = hostSvg.append("rect");
    bar.style("stroke", "#fff");
    bar.attr("width", visualGraph.getWidth());
    bar.attr("height", 60);
    bar.attr("x", 0);
    bar.attr("y", 0);
    bar.style("fill", "#fff");

   var rect = hostSvg.selectAll().data(visualGraph.getStartVisualNodes()).enter().append("rect");
   rect.style("stroke", "#fff");
   rect.attr("width", Global.HOST_SQUARE_SIZE);
   rect.attr("height", Global.HOST_SQUARE_SIZE);
   
   rect.attr("x", function(d) {
        return d.getX() - (Global.HOST_SQUARE_SIZE / 2);
    });
   
   rect.attr("y", function(d) {
        return 15;
    });
   
   rect.on("mouseover", function(e) {
        $("#curNode").text(e.getText());
    });
   
   rect.on("dblclick", function(e) {
        view.global.hideHost(e.getHost());
    });
   
   rect.attr("class", "node").style("fill", function(d) {
        return d.getFillColor();
    });


};

