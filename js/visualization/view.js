/**
 * Constructs a View that draws the specified model
 * 
 * @class
 * 
 * A View is responsible for drawing a single VisualGraph.
 * 
 * @constructor
 * @param {ModelGraph} model
 * @param {HostPermutation} hostPermutation
 * @param {String} label
 */
function View(model, hostPermutation, label) {
    
    /** @private */
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    this.$svg = $(this.svg);
    
    /** @private */
    this.hostSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    /** @private */
    this.logTable = $("<td></td>");
    
    /** @private */
    this.hostPermutation = hostPermutation;

    /** @private */
    this.label = label;

    /** @private */
    this.initialModel = model;

    /** @private */
    this.layout = new SpaceTimeLayout(0, 56);

    /** @private */
    this.visualGraph = new VisualGraph(model, this.layout, hostPermutation);

    /** @private */
    this.transformer = new Transformer();
    
    /** @private */
    this.controller = null;
    
}

/**
 * Gets the transformer associated with this view. In other words, the
 * transformer configured for and responsible for transforming the
 * {@link VisualGraph} that this view draws.
 * 
 * @returns {Transformer} The transformer associated with this view
 */
View.prototype.getTransformer = function() {
    return this.transformer;
};

View.prototype.getSVG = function() {
    return $(this.svg);
};

View.prototype.getHostSVG = function() {
    return $(this.hostSVG);
};

View.prototype.getLogTable = function() {
    return this.logTable;
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
 * Gets the label
 * 
 * @returns {Graph} The label
 */
View.prototype.getLabel = function() {
    return this.label;
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
    this.layout.setWidth(newWidth);
};

View.prototype.setLogTableWidth = function(newWidth) {
    this.logTable.width(newWidth + "pt");
};

/**
 * Clears the current visualization and re-draws the current model.
 */
View.prototype.draw = function() {
    
    var svg = d3.select(this.svg);
    var hostSVG = d3.select(this.hostSVG);

    this.model = this.initialModel.clone();
    this.visualGraph = new VisualGraph(this.model, this.layout, this.hostPermutation);
    this.transformer.transform(this.visualGraph);

    // Update the VisualGraph
    this.visualGraph.update();

    // Define locally so that we can use in lambdas below
    var view = this;

    svg.selectAll("*").remove();

    svg.attr({
        "height": this.visualGraph.getHeight(),
        "width": this.visualGraph.getWidth(),
    });

    drawLinks();
    drawNodes();
    drawHosts();
    drawLogLines();

    // Hide line highlight
    $(".highlight").hide();

    function drawLinks() {
        view.visualGraph.getVisualEdges().forEach(function(visualEdge) {
            visualEdge.updateCoords();
            view.$svg.append(visualEdge.getSVG());
        });
    }

    function drawNodes() {
        var vn = view.visualGraph.getNonStartVisualNodes();
        var nodes = svg.selectAll().data(vn).enter().append("g");
//        nodes.attr({
//            "transform": function(d) {
//                return "translate(" + d.getX() + "," + d.getY() + ")";
//            },
//            "id": function(d) {
//                return "node" + d.getId();
//            }
//        });

//        nodes.append("title").text(function(d) {
//            return d.getText();
//        });
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

        var selcirc = nodes.filter(function(n) {
            return n.isSelected();
        }).append("circle");
        selcirc.style({
            "fill": function(d) {
                return d.getFillColor();
            }
        });
        selcirc.attr({
            "class": "sel",
            "r": function(d) {
                return d.getRadius() + 4;
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
            },
            "opacity": function(d) {
                return d.getOpacity();
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
        view.controller.bindNodes(nodes); // TODO
    }

    function drawHosts() {
        // Draw the host bar
        hostSVG.selectAll("*").remove();
        
        hostSVG.attr({
            "width": view.visualGraph.getWidth(),
            "height": Global.HOST_SQUARE_SIZE,
            "class": view.id
        });

        var bar = hostSVG.append("rect");
        bar.attr({
            "width": view.visualGraph.getWidth(),
            "height": Global.HOST_SQUARE_SIZE,
            "class": "bg"
        });

        // Draw the hosts
        var svn = view.visualGraph.getStartVisualNodes();
        var hosts = hostSVG.selectAll().data(svn).enter().append("rect");
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
        view.controller.bindHosts(hosts); // TODO
    }

    function drawLogLines() {
        view.logTable.empty();
        
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
                    "color": vn[i].getFillColor(),
                    "opacity": vn[i].getOpacity()
                }).text(text);
                view.logTable.append($div);
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
                        "color": overflow[o].getFillColor(),
                        "opacity": vn[i].getOpacity()
                    }).text(text));
                    startMargin++;
                }

                view.logTable.append($div);
            }
        }

    }
};