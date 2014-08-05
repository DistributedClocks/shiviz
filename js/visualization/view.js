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
 * @param {HostPermutation} hostPermutation
 * @param {String} label
 */
function View(model, global, hostPermutation, label) {

    /** @private */
    this.hostPermutation = hostPermutation;

    /** @private */
    this.label = label;

    /** @private */
    this.initialModel = model;

    /** @private */
    this.model = model;

    /** @private */
    this.global = global;

    /** @private */
    this.visualGraph = new VisualGraph(this.model, new SpaceTimeLayout(0, 56), this.hostPermutation);

    /** @private */
    this.width = 500;
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
 * Gets the hosts as an array
 * 
 * @returns {Array<String>} The hosts
 */
View.prototype.getHosts = function() {
    return this.initialModel.getHosts();
};

/**
 * Gets the model
 * 
 * @returns {Graph} The model
 */
View.prototype.getModel = function() {
    return this.model;
};

/**
 * Gets the current visual model
 * 
 * @returns {VisualGraph} The current model
 */
View.prototype.getVisualModel = function() {
    return this.visualGraph;
};

/**
 * Sets the width of this view
 * 
 * @param {Number} newWidth The new width
 */
View.prototype.setWidth = function(newWidth) {
    this.width = newWidth;
};

/**
 * Reverts the View to initial graph & creates a new VisualGraph for the initial
 * model
 */
View.prototype.revert = function() {
    var layout = new SpaceTimeLayout(0, 56);
    var hp = this.hostPermutation;
    this.model = this.initialModel.clone();
    this.visualGraph = new VisualGraph(this.model, layout, hp);
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

    // Update the VisualGraph
    this.visualGraph.setWidth(this.width);
    this.visualGraph.update();

    // Define locally so that we can use in lambdas below
    var view = this;

    var svg = d3.select("#vizContainer").append("svg");

    svg.attr({
        "height": this.visualGraph.getHeight(),
        "width": this.visualGraph.getWidth(),
        "class": this.id
    });

    drawLinks();
    drawNodes();
    drawHosts();
    drawLogLines();

    // Hide line highlight
    $(".highlight").hide();

    function drawLinks() {
        var vedg = view.visualGraph.getVisualEdges();
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

    function drawNodes() {
        var vn = view.visualGraph.getNonStartVisualNodes();
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
        view.global.controller.bindNodes(nodes);
    }

    function drawHosts() {
        // Draw the host bar
        var hostSvg = d3.select("#hostBar").append("svg");
        hostSvg.attr({
            "width": view.visualGraph.getWidth(),
            "height": Global.HOST_SQUARE_SIZE,
            "class": view.id
        });

        var bar = hostSvg.append("rect");
        bar.attr({
            "width": view.visualGraph.getWidth(),
            "height": Global.HOST_SQUARE_SIZE,
            "class": "bg"
        });

        // Draw the hosts
        var svn = view.visualGraph.getStartVisualNodes();
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
        view.global.controller.bindHosts(hosts);
    }

    function drawLogLines() {
        var lines = {};
        var visualNodes = view.getVisualModel().getVisualNodes();
        for (var i in visualNodes) {
            var node = visualNodes[i];
            var y = node.getY();
            if (lines[y] === undefined)
                lines[y] = [ node ];
            else
                lines[y].push(node);
        }

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
        view.global.controller.bindLines($(".log .line:not(.more)"));
    }
};