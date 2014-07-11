/**
 * @class
 *
 * The Controller manipulates the model on user input.
 * It is responsible for maintaining transformations.
 *
 * @constructor
 * @param {Global} global Current Global object
 */
function Controller(global) {
    /** @private */
    this.global = global;

    /** @private */
    this.transformations = [];
}

/**
 * Adds a transformation
 * @param {Transformation} tf The transformation to add
 */
Controller.prototype.addTransformation = function(tf) {
    this.transformations.push(tf);
}

/**
 * Removes a transformation
 * 
 * @param  {Function|Transformation} tf A predicate function that returns
 *                                      true if given transformation is to be
 *                                      removed, OR the transformation that is
 *                                      to be removed
 */
Controller.prototype.removeTransformation = function(tf) {
    this.transformations = this.transformations.filter(function(t) {
        if (tf.constructor == Function)
            return !tf(t);
        else
            return !(tf == t);
    });
}

/**
 * Transforms the model through the listed transformations, in the order
 * provided in the list
 */
Controller.prototype.transform = function() {
    this.transformations.forEach(function (t) {
        t.transform(t.model);
    });
}

/**
 * Binds events to visual elements
 * 
 * @param  {d3.selection} nodes A D3 selection of the drawn nodes
 * @param  {d3.selection} hosts A D3 selection of the drawn hosts
 * @param  {jQuery.selection} lines A jQuery selection of the log lines
 */
Controller.prototype.bind = function(nodes, hosts, lines) {
    if (nodes) {
        nodes.on("click", function(e) {
            if (d3.event.shiftKey) {
                view.collapseSequentialNodesTransformation.toggleExemption(e.getNode());
                view.global.drawAll();
            }
            else if (!e.isCollapsed()) {
                selectTextareaLine($("#logField")[0], e.getLineNumber());
            }
        }).on("mouseover", function(e) {
            $("circle").filter(function(i, c) {
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
    }

    if (hosts) {
        hosts.on("mouseover", function(e) {
            $("#curNode").text(e.getText());
        }).on("dblclick", function(e) {
            if (d3.event.shiftKey) {
                view.global.toggleHighlightHost(e.getHost());
            }
            else {
                view.global.hideHost(e.getHost());
            }
        });
    }

    if (lines) {
        lines.unbind().on("mouseover", function() {
            var id = "#node" + $(this).data("id");
            $(id)[0].dispatchEvent(new MouseEvent("mouseover"));
        });
    }
}