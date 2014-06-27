/**
 * @class
 * 
 * A View for a ShiViz graph. A View is responsible for drawing a single
 * VisualGraph. It also collects transformations that generate new iterations of
 * the model.
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
 * Adds a transformation. The transformation is not applied until the draw
 * method is invoked. The difference between view.addTransformation and
 * global.addTransformation is that the global version adds applies the
 * transformation to all views.
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

    var visualGraph = new VisualGraph(currentModel, layout, this.global.hostColors);

    var transformations = this.global.getTransformations().concat(this.transformations);
    transformations.sort(function(a, b) {
        return b.priority - a.priority;
    });

    for (var i = 0; i < transformations.length; i++) {
        transformations[i].transform(visualGraph);
    }

    // Define locally so that we can use in lambdas below
    var view = this;

    var svg = d3.select("#vizContainer").append("svg");

    // Remove old diagrams, but only the ones with the same ID
    // so we don't remove the other executions
    d3.selectAll("." + this.id).remove();

    svg.attr({
        "height": visualGraph.getHeight(),
        "width": visualGraph.getWidth(),
        "class": this.id
    });

    // Draw links
    var link = svg.selectAll().data(visualGraph.getVisualEdges()).enter().append("line");

    link.style({
        "stroke-width": function(d) {
            return d.getWidth();
        },
        "stroke-dasharray": function(d) {
            return d.getDashLength() + "," + d.getDashLength();
        }
    });
    link.attr({
        "x1": function(d) {
            return d.getSourceVisualNode().getX();
        },
        "y1": function(d) {
            return d.getSourceVisualNode().getY();
        },
        "x2": function(d) {
            return d.getTargetVisualNode().getX();
        },
        "y2": function(d) {
            return d.getTargetVisualNode().getY();
        }
    });

    // draw non-start nodes
    var node = svg.selectAll().data(visualGraph.getNonStartVisualNodes()).enter().append("g");
    node.attr({
        "transform": function(d) {
            return "translate(" + d.getX() + "," + d.getY() + ")";
        }
    });
    node.on("click", function(e) {
        if (d3.event.shiftKey) {
            view.collapseSequentialNodesTransformation.toggleExemption(e.getNode());
            view.global.drawAll();
        } else if (!e.isCollapsed()) {
            selectTextareaLine($("#logField")[0], e.getLineNumber());
        }
    });

    node.append("title").text(function(d) {
        return d.getText();
    });

    var circle = node.append("circle");
    circle.on("mouseover", function(e) {
        $("#curNode").text(e.getText());
    });
    circle.style("fill", function(d) {
        return d.getFillColor();
    });
    circle.attr({
        "class": function(d) {
            return d.getHost();
        },
        "r": function(d) {
            return d.getRadius();
        }
    });

    var label = node.append("text");
    label.text(function(d) {
        return d.getLabel();
    });

    // draw the host bar
    var hostSvg = d3.select("#hostBar").append("svg");
    hostSvg.attr({
        "width": visualGraph.getWidth(),
        "class": this.id
    });

    var bar = hostSvg.append("rect");
    bar.attr({
        "width": visualGraph.getWidth(),
        "height": 55,
        "class": "bg"
    });

    // draw the hosts
    var rect = hostSvg.selectAll().data(visualGraph.getStartVisualNodes()).enter().append("rect");
    rect.attr({
        "width": Global.HOST_SQUARE_SIZE,
        "height": Global.HOST_SQUARE_SIZE,
        "y": 15,
        "x": function(d) {
            return d.getX() - (Global.HOST_SQUARE_SIZE / 2);
        },
        "fill": function(d) {
            return d.getFillColor();
        }
    });
    rect.on("mouseover", function(e) {
        $("#curNode").text(e.getText());
    });
    rect.on("dblclick", function(e) {
        view.global.hideHost(e.getHost());
    });
};