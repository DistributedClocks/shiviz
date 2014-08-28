/**
 * Constructs a Controller to control the given {@link Global}
 * 
 * @classdesc
 * 
 * The Controller manipulates the model on user input. It is responsible for
 * maintaining {@link Transformation}s.
 * 
 * @constructor
 */
function Controller(global) {

    /** @private */
    this.global = global;

    var self = this;

    $(window).unbind("scroll");
    $(window).bind("scroll", self.onScroll);
    $(window).scroll();

    $(window).unbind("resize");
    $(window).on("resize", function() {
        try {
            self.global.drawAll();
        }
        catch (exception) {
            Shiviz.getInstance().handleException(exception);
        }
    });

    $(window).unbind("keydown.dialog").on("keydown.dialog", function(e) {
        if (e.which == 27) {
            $(".dialog").hide();
            d3.select("circle.sel").each(function(d) {
                $(this).remove();
                d.setSelected(false);
            });
        }
    });

    $(window).unbind("click.dialog").on("click.dialog", function(e) {
        var $target = $(e.target);
        var tn = $target.prop("tagName");

        // Test for click inside dialog
        if ($target.is(".dialog") || $target.parents(".dialog").length)
            return;
        // Test for node or host click
        if (tn == "g" || $target.parents("g").length || tn == "rect")
            return;
        // Test for line click
        if ($target.parents(".log").length || $target.is(".highlight"))
            return;
        // Test for clickable
        if (tn.match(/input/i) || tn.match(/button/i))
            return;
        // Test for panel visibility
        if ($("#searchbar #panel:visible").length)
            return;

        $(".dialog").hide();
        d3.select("circle.sel").each(function(d) {
            $(this).remove();
            d.setSelected(false);
        });
    });

    $(".dialog button").unbind().click(function() {
        var type = this.name;
        var e = $(".dialog").data("element");

        switch (type) {

            // Hide host
            case "hide":
                self.hideHost(e);
                break;

            // Unhide host
            case "unhide":
                self.unhideHost(e);
                break;

            // Highlight host
            case "filter":
                self.toggleHostHighlight(e);
                break;

            // Toggle collapse
            case "collapse":
                self.toggleCollapseNode(e);
                break;
        }

    });
}

/**
 * Highlights a motif across all {@link View}s using the provided motif finder.
 * The visualization is then re-drawn.
 * 
 * @param {MotifFinder} motifFinder
 * @see {@link HighlightMotifTransformation}
 */
Controller.prototype.highlightMotif = function(motifFinder) {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().highlightMotif(motifFinder, false);
    });

    this.global.drawAll();
};

/**
 * Clears highlighting of motifs across all {@link View}s. The visualization is
 * then re-drawn
 * 
 * @see {@link HighlightMotifTransformation}
 */
Controller.prototype.clearHighlight = function() {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().unhighlightMotif();
    });

    this.global.drawAll();
};

/**
 * Determines if a motif is being highlighted in any of the {@link View}s.
 * 
 * @returns {Boolean} True if a motif is being highlighted
 */
Controller.prototype.hasHighlight = function() {
    var views = this.global.getViews();
    for (var i = 0; i < views.length; i++) {
        if (views[i].getTransformer().hasHighlightedMotif()) {
            return true;
        }
    }
    return false;
};

/**
 * Hides the specified host across all {@link View}s. The visualization is then
 * re-drawn.
 * 
 * @param {String} host The host to hide.
 */
Controller.prototype.hideHost = function(host) {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().hideHost(host);
    });

    this.global.drawAll();
};

/**
 * Unhides the specified host across all {@link View}s. The visualization is
 * then re-drawn.
 * 
 * @param {String} host The host to unhide.
 */
Controller.prototype.unhideHost = function(host) {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().unhideHost(host);
    });

    this.global.drawAll();
};

/**
 * Toggles the highlighting of a host across all {@link View}s. The
 * visualization is then re-drawn.
 * 
 * @param {String} host The host whose highlighting is to be toggled
 */
Controller.prototype.toggleHostHighlight = function(host) {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().toggleHighlightHost(host);
    });

    this.global.drawAll();
};

/**
 * Toggles the collapsing of a node.
 * 
 * @param {ModelNode} node
 */
Controller.prototype.toggleCollapseNode = function(node) {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().toggleCollapseNode(node);
    });

    this.global.drawAll();
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
            // Toggle node collapsing
            controller.toggleCollapseNode(e.getNode());
        }
        else {
            controller.showDialog(e, 0, this);
        }
    }).on("mouseover", function(e) {
        d3.selectAll("g.focus .sel").transition().duration(100).attr({
            "r": function(d) {
                return d.getRadius() + 4;
            }
        });
        d3.selectAll("g.focus").classed("focus", false).select("circle:not(.sel)").transition().duration(100).attr({
            "r": function(d) {
                return d.getRadius();
            }
        });

        d3.select(this).classed("focus", true).select("circle:not(.sel)").transition().duration(100).attr({
            "r": function(d) {
                return d.getRadius() + 2;
            }
        });
        d3.selectAll("g.focus .sel").transition().duration(100).attr({
            "r": function(d) {
                return d.getRadius() + 6;
            }
        });

        $(".event").text(e.getText());
        $(".fields").children().remove();
        if (!e.isCollapsed()) {
            var fields = e.getNode().getLogEvents()[0].getFields();
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
            "height": $line.height(),
            "opacity": e.getOpacity()
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
        }).data({
            "id": e.getId()
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
        var views = controller.global.getViews();

        if (d3.event.shiftKey) {
            // Filtering by host
            // If more than one view / execution then return
            if (views.length != 1)
                return;

            controller.toggleHostHighlight(e.getHost());
        }
        else {
            // Hide host
            controller.hideHost(e.getHost());
        }
    }).on("click", function(e) {
        controller.showDialog(e, 1, this);
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
    })

    lines.add(".highlight").on("click", function() {
        var id = "#node" + $(this).data("id");
        $(id)[0].dispatchEvent(new MouseEvent("click"));
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

        var views = controller.global.getViews();
        views.forEach(function(view) {
            view.getTransformer().unhideHost(e);
        });
        controller.global.drawAll();

    }).on("mouseover", function(e) {
        $(".event").text(e);
        $(".fields").children().remove();
    }).on("click", function(e) {
        controller.showDialog(e, 2, this);
    });
};

/**
 * Ensures things are positioned correctly on scroll
 * 
 * @private
 * @param {Event} e The event object JQuery passes to the handler
 */
Controller.prototype.onScroll = function(e) {
    var x = window.pageXOffset;
    $("#hostBar, .dialog.host").css("margin-left", -x);
    $(".log").css("margin-left", x);

    if ($(".line.focus").length)
        $(".highlight").css({
            "left": $(".line.focus").offset().left - parseFloat($(".line.focus").css("margin-left"))
        });
};

/**
 * Shows the node selection popup dialog
 * 
 * @param {VisualNode} e The VisualNode that is selected
 * @param {Number} type The type of node: 0 for regular, 1 for host, 2 for
 *            hidden host
 * @param {DOMElement} elem The SVG node element
 */
Controller.prototype.showDialog = function(e, type, elem) {

    // Remove existing selection highlights
    d3.select("circle.sel").each(function(d) {
        $(this).remove();
        d.setSelected(false);
    });

    // Highlight the node with circular outline
    if (!type) {
        e.setSelected(true);

        var selcirc = d3.select("#node" + e.getId()).insert("circle", "circle");
        selcirc.style({
            "fill": function(d) {
                return d.getFillColor();
            }
        });
        selcirc.attr({
            "class": "sel",
            "r": function(d) {
                return d.getRadius() + 6;
            }
        });
    }

    var $dialog = $(".dialog");
    var $svg = $(elem).parents("svg");
    var $graph = $("#graph");

    // Set properties for dialog, and show
    if (type == 2)
        $dialog.css({
            "left": $(elem).offset().left - $dialog.width() - 40
        }).removeClass("left").addClass("right").show();
    else if (e.getX() - $(window).scrollLeft() > $graph.width() / 2)
        $dialog.css({
            "left": e.getX() + $svg.offset().left - $dialog.width() - 40,
            "margin-left": type ? -$(window).scrollLeft() : 0
        }).removeClass("left").addClass("right").show();
    else
        $dialog.css({
            "left": e.getX() + $svg.offset().left + 40,
            "margin-left": type ? -$(window).scrollLeft() : 0
        }).removeClass("right").addClass("left").show();

    // Set fill color, etc.
    if (type)
        $dialog.css({
            "top": $(elem).offset().top - $(window).scrollTop() + Global.HOST_SQUARE_SIZE / 2,
            "background": type == 2 ? $(elem).css("fill") : e.getFillColor(),
            "border-color": type == 2 ? $(elem).css("fill") : e.getFillColor()
        }).data("element", type == 2 ? e : e.getHost());
    else
        $dialog.css({
            "top": e.getY() + $svg.offset().top,
            "background": e.getFillColor(),
            "border-color": e.getFillColor()
        }).data("element", e.getNode());

    // Set class "host" if host (hidden or not) is selected
    if (type)
        $dialog.addClass("host");
    else
        $dialog.removeClass("host");

    // Add info to the dialog
    $dialog.find(".name").text(type == 2 ? e : e.getText());
    $dialog.find(".info").children().remove();

    if (!type && !e.isCollapsed()) {
        // Add fields, if normal node
        var fields = e.getNode().getLogEvents()[0].getFields();
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
            $dialog.find(".info").append($f);
        }

        // Hide highlight button
        $dialog.find(".filter").hide();

        // If node is collapsible then show collapse button
        // Else don't show button
        if (!CollapseSequentialNodesTransformation.isCollapseable(e.getNode(), 2))
            $dialog.find(".collapse").hide();
        else
            $dialog.find(".collapse").show().text("Collapse");

    }
    else if (!type) {
        // Show uncollapse button for collapsed nodes
        $dialog.find(".collapse").show().text("Expand");
        $dialog.find(".filter").hide();
    }
    else {
        // Show highlight button if only one execution
        if (type == 2 || this.global.getViews().length > 1)
            $dialog.find(".filter").hide();
        else
            $dialog.find(".filter").show();

        // Set highlight/unhighlight based on current state
        if (type != 2 && e.isHighlighted())
            $dialog.find(".filter").text("Unfilter");
        else
            $dialog.find(".filter").text("Filter");

        // Set hide/unhide based on state
        if (type == 2)
            $dialog.find(".hide").attr("name", "unhide").text("Unhide");
        else
            $dialog.find(".hide").attr("name", "hide").text("Hide");

        // Hide collapse button
        $dialog.find(".collapse").hide();
    }
}
