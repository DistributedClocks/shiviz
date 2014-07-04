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
    var layout = new SpaceTimeLayout(this.width, 48);

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
            return d.getDashLength();
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
        },
        "id": function(d) {
            return "node" + d.getId();
        }
    });
    node.on("click", function(e) {
        if (d3.event.shiftKey) {
            view.collapseSequentialNodesTransformation.toggleExemption(e.getNode());
            view.global.drawAll();
        }
        else if (!e.isCollapsed()) {
            selectTextareaLine($("#logField")[0], e.getLineNumber());
        }

    });

    node.append("title").text(function(d) {
        return d.getText();
    });
    node.append("rect").attr({
        "width": 48,
        "height": 48,
        "x": -24,
        "y": -24
    });
    node.on("mouseover", function(e) {
        $("circle").filter(function(i,c) {
            return $(c).data("focus");
        }).attr("r", function() {
            return $(this).data("r");
        }).data("focus", false);

        $(this).find("circle").data({
            "focus": true
        }).attr({
            "r": $(this).find("circle").data("r") + 2 
        });

        $("#curNode").text(e.getText());

        $(".focus").css({
            "color": $(".focus").data("fill"),
            "background": "",
            "width": "inherit"
        }).removeClass("focus");

        $(".reveal").removeClass("reveal");

        var $line = $("#line" + e.getId());
        var $parent = $line.parent(".line").addClass("reveal");

        $line.addClass("focus").css({
            "background": "transparent",
            "color": "white",
            "width": "calc(" + $line.width() + "px - 1em)"
        }).data("fill", e.getFillColor())

        $(".highlight").css({
            "width": $line.width(),
            "height": $line.height()
        });

        var top = parseFloat($line.css("top")) || 0;
        var ptop = parseFloat($parent.css("top")) || 0;
        var margin = parseFloat($line.css("margin-top")) || 0;
        var pmargin = parseFloat($parent.css("margin-top")) || 0;
        var offset = $(".log").offset().top;

        $(".highlight").css({
            "background": e.getFillColor(),
            "top": top + ptop + margin + pmargin + offset,
            "left": $line.offset().left - parseFloat($line.css("margin-left"))
        }).attr({
            "data-ln": e.getLineNumber()
        }).show();
    });

    var hiddenParentLinks = node.filter(function(val) {
        return val.hasHiddenParent();
    }).append("line");

    hiddenParentLinks.attr({
        "class": "hidden-link",
        "x1": 0,
        "y1": 0,
        "x2": function(d) {
            return (Global.HIDDEN_EDGE_LENGTH + d.getRadius()) / Math.sqrt(2);
        },
        "y2": function(d) {
            return -(Global.HIDDEN_EDGE_LENGTH + d.getRadius()) / Math.sqrt(2);
        }
    });

    var hiddenChildLinks = node.filter(function(val) {
        return val.hasHiddenChild();
    }).append("line");

    hiddenChildLinks.attr({
        "class": "hidden-link",
        "x1": 0,
        "y1": 0,
        "x2": function(d) {
            return (Global.HIDDEN_EDGE_LENGTH + d.getRadius()) / Math.sqrt(2);
        },
        "y2": function(d) {
            return (Global.HIDDEN_EDGE_LENGTH + d.getRadius()) / Math.sqrt(2);
        }
    });

    var circle = node.append("circle");
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

    var label = node.append("text");
    label.text(function(d) {
        return d.getLabel();
    });

    // draw the host bar
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

    // draw the hosts
    var rect = hostSvg.selectAll().data(visualGraph.getStartVisualNodes()).enter().append("rect");
    rect.attr({
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
    rect.style({
        "stroke": function(d) {
            return d.getStrokeColor();
        },
        "stroke-width": function(d) {
            return d.getStrokeWidth() + "px";
        }
    });
    rect.on("mouseover", function(e) {
        $("#curNode").text(e.getText());
    });
    rect.on("dblclick", function(e) {
        if (d3.event.shiftKey) {
            view.global.toggleHighlightHost(e.getHost());
        }
        else {
            view.global.hideHost(e.getHost());
        }
    });

    d3.selectAll(".high-host").each(function(d) {
        var ns = "http://www.w3.org/2000/svg";
        var r = document.createElementNS(ns, "rect");
        $(r).attr({
            "class": "high-rect",
            "width": "15",
            "height": "15",
            "x": function() {
                return Math.round(d.getX() - Global.HOST_SQUARE_SIZE / 2 + 5);
            },
            "y": function() {
                return d.getY() + 5;
            }
        });
        this.parentNode.appendChild(r);
    });

    // Hide line highlight
    $(".highlight").hide();

    // draw the log lines
    var lines = visualGraph.lines;
    delete lines[0];

    for (var y in lines) {
        var vn = lines[y];
        var startMargin = (1 - Math.min(vn.length, 3)) / 2;

        if (vn.length > 3)
            var other = vn.splice(2, vn.length);
        else
            var other = false;

        for (var i in vn) {
            var text = vn[i].getText();
            var $div = $("<div></div>").attr({
                "id": "line" + vn[i].getId()
            }).data({
                "id": vn[i].getId()
            }).addClass("line").css({
                "top": y + "px",
                "margin-top": startMargin + "em",
                "color": vn[i].getFillColor()
            }).text(text).on("mouseover", function () {
                var id = "#node" + $(this).data("id");
                $(id)[0].dispatchEvent(new MouseEvent("mouseover"));
            });
            $(".log td:last-child").append($div);
            startMargin++;
        }

        if (other) {
            var $div = $("<div></div>").addClass("line more").css({
                "top": y + "px",
                "margin-top": (startMargin * 10) + "pt",
                "color": "#ddd"
            }).text("+ " + other.length + " more");

            for (var o in other) {
                var text = other[o].getText();
                $div.append($("<div></div>").attr({
                    "id": "line" + other[o].getId()
                }).data({
                    "id": other[o].getId()
                }).addClass("line").css({
                    "margin-top": o + "em",
                    "color": other[o].getFillColor()
                }).text(text).on("mouseover", function () {
                    var id = "#node" + $(this).data("id");
                    $(id)[0].dispatchEvent(new MouseEvent("mouseover"));
                }));
                startMargin++;
            }

            $(".log td:last-child").append($div);
        }
    }
};