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
        catch(exception) {
            Shiviz.getInstance().handleException(exception);
        }
    });
   
}


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
            var views = controller.global.getViews();
            views.forEach(function(view) {
                view.getTransformer().toggleCollapseNode(e.getNode());
            });

            controller.global.drawAll();
        } else {
            d3.select("circle.sel").each(function(d) {
                $(this).remove();
                d.setSelected(false);
            });

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

            var $dialog = $(".dialog");
            var $svg = $(this).parents("svg");
            if (e.getX() > $svg.width() / 2)
                $dialog.css({
                    "left": e.getX() + $svg.offset().left + 40
                }).removeClass("right").addClass("left").show();
            else
                $dialog.css({
                    "left": e.getX() + $svg.offset().left - $dialog.width() - 40
                }).removeClass("left").addClass("right").show();

            $dialog.css({
                "top": e.getY() + $svg.offset().top,
                "background": e.getFillColor(),
                "border-color": e.getFillColor()
            });

            $dialog.find(".name").text(e.getText());
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
            
            views.forEach(function(view) {
               view.getTransformer().toggleHighlightHost(e.getHost()); 
            });

        } else {
            // Hide host
            views.forEach(function(view) {
                view.getTransformer().hideHost(e.getHost());
             });
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
        
        var views = controller.global.getViews();
        views.forEach(function(view) {
          view.getTransformer().unhideHost(e);  
        });
        controller.global.drawAll();
        
    }).on("mouseover", function(e) {
        $(".event").text(e);
        $(".fields").children().remove();
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
    $("#hostBar").css("margin-left", -x);
    $(".log").css("margin-left", x);

    if ($(".line.focus").length)
        $(".highlight").css({
            "left": $(".line.focus").offset().left - parseFloat($(".line.focus").css("margin-left"))
        });
};