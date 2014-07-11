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
    this.collapse = new CollapseSequentialNodesTransformation(2);
    this.addTransformation(this.collapse);
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
 * Clears the current visualization and draws the current model.
 */
View.prototype.draw = function() {
    // Assign a unique ID to each execution so we can distinguish
    // them
    if (this.id == null) {
        this.id = "view" + d3.selectAll("#vizContainer > svg").size();
    }

    // Apply all transformations applied to this view an those applied to global
    var currentModel = this.initialModel.clone();
    var layout = new SpaceTimeLayout(this.width, 56);

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

    this.drawLinks(visualGraph, svg);
    this.drawNodes(visualGraph, svg);
    this.drawHosts(visualGraph, svg);
    this.drawLogLines(visualGraph);

    // Hide line highlight
    $(".highlight").hide();
};

/**
 * Draws the links
 * 
 * @param  {VisualGraph} visualGraph The graph to draw links for
 * @param  {DOMElement}  svg         The SVG element to draw in
 */
View.prototype.drawLinks = function(visualGraph, svg) {
    var vedg = visualGraph.getVisualEdges();
    var links = svg.selectAll().data(vedg).enter().append("line");
    links.style({
        "stroke-width": function(d) {
            return d.getWidth() + "px";
        },
        "stroke-dasharray": function(d) {
            return d.getDashLength();
        },
        "stroke": function(d) {
            return d.getColor();
        },
        "opacity": function(d) {
            return d.getOpacity();
        }
    });
    links.attr({
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
}

/**
 * Draws the nodes
 * 
 * @param  {VisualGraph} visualGraph The graph to draw nodes for
 * @param  {DOMElement}  svg         The SVG element to draw in
 */
View.prototype.drawNodes = function(visualGraph, svg) {
    var vn = visualGraph.getNonStartVisualNodes();
    var nodes = svg.selectAll().data(vn).enter().append("g");
    nodes.attr({
        "transform": function(d) {
            return "translate(" + d.getX() + "," + d.getY() + ")";
        },
        "id": function(d) {
            return "node" + d.getId();
        }
    });
    nodes.append("title").text(function(d) {
        return d.getText();
    });
    nodes.append("rect").attr({
        "width": 48,
        "height": 48,
        "x": -24,
        "y": -24
    });

    // Draw faded hidden links
    var hiddenParentLinks = nodes.filter(function(val) {
        return val.hasHiddenParent();
    }).append("line");
    hiddenParentLinks.attr({
        "class": "hidden-link",
        "x1": 0,
        "y1": 0,
        "x2": function(d) {
            return (Global.HIDDEN_EDGE_LENGTH + d.getRadius());
        },
        "y2": function(d) {
            return -(Global.HIDDEN_EDGE_LENGTH + d.getRadius());
        }
    });
    var hiddenChildLinks = nodes.filter(function(val) {
        return val.hasHiddenChild();
    }).append("line");
    hiddenChildLinks.attr({
        "class": "hidden-link",
        "x1": 0,
        "y1": 0,
        "x2": function(d) {
            return (Global.HIDDEN_EDGE_LENGTH + d.getRadius());
        },
        "y2": function(d) {
            return (Global.HIDDEN_EDGE_LENGTH + d.getRadius());
        }
    });

    var circle = nodes.append("circle");
    circle.style({
        "fill": function(d) {
            return d.getFillColor();
        },
        "stroke": function(d) {
            return d.getStrokeColor();
        },
        "stroke-width": function(d) {
            return d.getStrokeWidth() + "px";
        }
    });
    circle.attr({
        "class": function(d) {
            return d.getHost();
        },
        "r": function(d) {
            return d.getRadius();
        },
        "data-r": function(d) {
            return d.getRadius();
        }
    });

    var label = nodes.append("text");
    label.text(function(d) {
        return d.getLabel();
    });

    // Bind the nodes
    this.global.controller.bind(nodes);
}

/**
 * Draws the hosts
 * 
 * @param  {VisualGraph} visualGraph The graph to draw hosts for
 * @param  {DOMElement}  svg         The SVG element to draw in
 */
View.prototype.drawHosts = function(visualGraph, svg) {
    // Draw the host bar
    var hostSvg = d3.select("#hostBar").append("svg");
    hostSvg.attr({
        "width": visualGraph.getWidth(),
        "height": Global.HOST_SQUARE_SIZE,
        "class": this.id
    });

    var bar = hostSvg.append("rect");
    bar.attr({
        "width": visualGraph.getWidth(),
        "height": Global.HOST_SQUARE_SIZE,
        "class": "bg"
    });

    // Draw the hosts
    var svn = visualGraph.getStartVisualNodes();
    var hosts = hostSvg.selectAll().data(svn).enter().append("rect");
    hosts.attr({
        "width": Global.HOST_SQUARE_SIZE,
        "height": Global.HOST_SQUARE_SIZE,
        "y": 0,
        "x": function(d) {
            return Math.round(d.getX() - (Global.HOST_SQUARE_SIZE / 2));
        },
        "fill": function(d) {
            return d.getFillColor();
        },
        "class": function(d) {
            if (d.isHighlighted())
                return "high-host";
        }
    });
    hosts.style({
        "stroke": function(d) {
            return d.getStrokeColor();
        },
        "stroke-width": function(d) {
            return d.getStrokeWidth() + "px";
        }
    });

    // Draw highlighting for highlighted hosts
    d3.selectAll(".high-host").each(function(d) {
        var ns = "http://www.w3.org/2000/svg";
        var r = document.createElementNS(ns, "rect");
        $(r).attr({
            "class": "high-rect",
            "width": "15",
            "height": "15",
            "x": function() {
                var px = d.getX() - Global.HOST_SQUARE_SIZE / 2 + 5;
                return Math.round(px);
            },
            "y": function() {
                return d.getY() + 5;
            }
        });
        this.parentNode.appendChild(r);
    });

    // Bind the hosts
    this.global.controller.bind(null, hosts);
}

/**
 * Draws the log lines
 * 
 * @param  {VisualGraph} visualGraph The graph to draw log lines for
 */
View.prototype.drawLogLines = function(visualGraph) {
    var lines = visualGraph.lines;
    delete lines[0];

    for (var y in lines) {
        var overflow = null;
        var vn = lines[y];
        var startMargin = (1 - Math.min(vn.length, 3)) / 2;

        if (vn.length > 3)
            overflow = vn.splice(2, vn.length);

        for (var i in vn) {
            var text = vn[i].getText();
            var $div = $("<div></div>", {
                "id": "line" + vn[i].getId()
            }).data({
                "id": vn[i].getId()
            }).addClass("line").css({
                "top": y + "px",
                "margin-top": startMargin + "em",
                "color": vn[i].getFillColor()
            }).text(text);
            $(".log td:last-child").append($div);
            startMargin++;
        }

        if (overflow != null) {
            var $div = $("<div></div>").addClass("line more").css({
                "top": y + "px",
                "margin-top": (startMargin * 10) + "pt",
                "color": "#ddd"
            }).text("+ " + overflow.length + " more");

            for (var o in overflow) {
                var text = overflow[o].getText();
                $div.append($("<div></div>", {
                    "id": "line" + overflow[o].getId()
                }).data({
                    "id": overflow[o].getId()
                }).addClass("line").css({
                    "margin-top": o + "em",
                    "color": overflow[o].getFillColor()
                }).text(text));
                startMargin++;
            }

            $(".log td:last-child").append($div);
        }
    }

    // Bind the log lines
    this.global.controller.bind(null, null, $(".log .line:not(.more)"));
}