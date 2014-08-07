/**
 * Constructs a Controller to control the given {@link Global}
 * 
 * @classdesc
 * 
 * The Controller manipulates the model on user input. It is responsible for
 * maintaining {@link Transformation}s.
 * 
 * @constructor
 * @param {Global} global Current Global object
 */
function Controller(global) {
    /** @private */
    this.global = global;

    /** @private */
    this.transformers = [];
    
    var context = this;
    
    $("#searchInput").keypress(function(e) {
        if (e.which == 13) {
            var text = $("#searchInput").val();
            context.query(text);
          } 
    });
}

Controller.prototype.query = function(queryText) {
    var highlightTransformation = new HighlightMotifTransformation(new TextQueryMotifFinder(queryText), false);
    
    this.transformers.forEach(function(transformer) {
        transformer.addTransformation(highlightTransformation);
    });
    
    this.transform();
    this.global.drawAll();
};

/**
 * Creates a {@link Transformer} for the new {@link View}, and adds default
 * transformation. Should be called from Global every time a view is added.
 * 
 * @param {View} view The View that was added.
 */
Controller.prototype.addView = function(view) {
    var cstf = new CollapseSequentialNodesTransformation(2);
    var tfr = new Transformer(view.getVisualModel());

    tfr.addTransformation(cstf, true);
    this.transformers.push(tfr);
    this.transform();
};

/**
 * Transforms the model through the listed {@link Transformation}s, in the
 * order provided in the list
 */
Controller.prototype.transform = function() {
    var transformers = this.transformers;

    // Revert each view to original (untransformed) state
    this.global.getViews().forEach(function(view) {
        var origVisGraph = view.getVisualModel();
        view.revert();
        var newVisGraph = view.getVisualModel();

        transformers.forEach(function(tfr) {
            if (tfr.getVisualModel() === origVisGraph)
                tfr.setVisualModel(newVisGraph);
        });
    });

    transformers.forEach(function(tfr) {
        tfr.transform();
    });
};

/**
 * Binds events to the nodes.
 * 
 * <ul>
 * <li>mouseover: highlights node & log line, shows info in sidebar</li>
 * <li>shift + click: toggles collapsed node</li>
 * </ul>
 * 
 * @param {d3.selection} nodes A D3 selection of the nodes.
 */
Controller.prototype.bindNodes = function(nodes) {
    var controller = this;
    nodes.on("click", function(e) {
        if (d3.event.shiftKey) {
            controller.transformers.forEach(function(tfr) {
                var ct = tfr.getTransformations(function(t) {
                    return t.constructor == CollapseSequentialNodesTransformation;
                }, true).forEach(function(t) {
                    t.toggleExemption(e.getNode());
                });
            });

            controller.transform();
            controller.global.drawAll();
        }
    }).on("mouseover", function(e) {
        d3.selectAll("circle.focus").classed("focus", false).transition().duration(100).attr({
            "r": function(d) {
                return d.getRadius();
            }
        });

        d3.select(this).select("circle").classed("focus", true).transition().duration(100).attr({
            "r": function(d) {
                return d.getRadius() + 2;
            }
        });

        $(".event").text(e.getText());
        $(".fields").children().remove();
        if (!e.isCollapsed()) {
            var fields = e.getNode().getLogEvents()[0].getFields();
            var fieldText = "";
            for (var i in fields) {
                var $f = $("<tr>", {
                    "class": "field"
                });
                var $t = $("<th>", {
                    "class": "title"
                }).text(i + ":");
                var $v = $("<td>", {
                    "class": "value"
                }).text(fields[i]);

                $f.append($t).append($v);
                $(".fields").append($f);
            }
        }

        $(".line.focus").css({
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
        }).data("fill", e.getFillColor());

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
};

/**
 * Binds events to hosts
 * 
 * <ul>
 * <li>double-click: Hides the host</li>
 * <li>shift+double-click: Highlights the host</li>
 * </ul>
 * 
 * @param {d3.selection} hosts A D3 selection of the host rects
 */
Controller.prototype.bindHosts = function(hosts) {
    var controller = this;
    hosts.on("mouseover", function(e) {
        $(".event").text(e.getText());
        $(".fields").children().remove();
    }).on("dblclick", function(e) {
        if (d3.event.shiftKey) {
            // TODO: Cleanup!!
            // Filtering by host
            if (controller.global.getViews().length != 1)
                return;

            var tfr = controller.transformers[0];

            // Update hidden hosts list for hosts hidden by highlighting
            var hh = tfr.getTransformations(function(t) {
                return t.constructor == HighlightHostTransformation;
            });
            if (hh.length) {
                var hiddenHosts = hh[hh.length - 1].getHiddenHosts();
                hiddenHosts.forEach(function(h) {
                    controller.global.removeHiddenHost(h);
                });
            }

            var existingHighlights = tfr.getTransformations(function(t) {
                if (t.constructor == HighlightHostTransformation)
                    return t.getHosts()[0] == e.getHost();
            });

            if (existingHighlights.length) {
                existingHighlights.forEach(function(t) {
                    tfr.removeTransformation(t);
                });
            }
            else {
                var hightf = new HighlightHostTransformation(e.getHost());
                tfr.addTransformation(hightf);
            }

            controller.transform();

            // Add hidden hosts back
            hh = tfr.getTransformations(function(t) {
                return t.constructor == HighlightHostTransformation;
            });
            if (hh.length) {
                var hiddenHosts = hh[hh.length - 1].getHiddenHosts();
                hiddenHosts.forEach(function(h) {
                    controller.global.addHiddenHost(h);
                });
            }
        }
        else {
            // Hide host
            controller.transformers.forEach(function(tfr) {
                var hhtf = new HideHostTransformation(e.getHost());
                controller.global.addHiddenHost(e.getHost());
                tfr.addTransformation(hhtf);
            });

            controller.transform();
        }

        controller.global.drawAll();
    });
};

/**
 * Binds node highlighting to mouseover event on log lines
 * 
 * @param {jQuery.selection} lines A jQuery selection of the log lines
 */
Controller.prototype.bindLines = function(lines) {
    lines.unbind().on("mouseover", function() {
        var id = "#node" + $(this).data("id");
        $(id)[0].dispatchEvent(new MouseEvent("mouseover"));
    });
};

/**
 * Binds unhide to double-click event on hidden hosts.
 * 
 * @param {d3.selection} hh The hidden hosts
 */
Controller.prototype.bindHiddenHosts = function(hh) {
    var controller = this;
    hh.on("dblclick", function(e) {
        controller.transformers.forEach(function(tfr) {
            var high = tfr.getTransformations(function(t) {
                if (t.constructor == HighlightHostTransformation)
                    return t.getHiddenHosts().indexOf(e) > -1;
            });

            if (high.length) {
                var hh = tfr.getTransformations(function(t) {
                    return t.constructor == HighlightHostTransformation;
                });
                var hiddenHosts = hh[hh.length - 1].getHiddenHosts();
                hiddenHosts.forEach(function(h) {
                    controller.global.removeHiddenHost(h);
                });

                hh.forEach(function(t) {
                    tfr.removeTransformation(t);
                });
            }

            tfr.removeTransformation(function(t) {
                if (t.constructor == HideHostTransformation)
                    return t.getHost() == e;
            });
        });

        controller.transform();
        controller.global.removeHiddenHost(e);
        controller.global.drawAll();
    }).on("mouseover", function(e) {
        $(".event").text(e);
        $(".fields").children().remove();
    });
};