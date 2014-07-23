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

    /** @private */
    this.defaultTransformations = [];
}

/**
 * Adds a transformation
 * @param {Transformation} tf The transformation to add
 * @param {Boolean} isDefault Whether the transformation is a
 *                            default transformation
 */
Controller.prototype.addTransformation = function(tf, isDefault) {
    if (isDefault)
        this.defaultTransformations.push(tf);
    else
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

    this._dirty = true;
}

Controller.prototype.addView = function(view) {
    var cstf = new CollapseSequentialNodesTransformation(view.getVisualModel(), 2);
    this.addTransformation(cstf, true);
    this.transform();
}

/**
 * Transforms the model through the listed transformations, in the order
 * provided in the list
 */
Controller.prototype.transform = function() {
    var tfs = this.transformations.concat(this.defaultTransformations);

    this.global.getViews().forEach(function(v) {
        var ovg = v.getVisualModel();
        v.revert();
        var nvg = v.getVisualModel();

        tfs.forEach(function(tf) {
            if (tf.getModel() === ovg)
                tf.setModel(nvg);
        });
    });

    tfs.forEach(function(t) {
        t.transform();
    });
}

/**
 * Binds events to visual elements
 * 
 * @param  {d3.selection} nodes A D3 selection of the drawn nodes
 * @param  {d3.selection} hosts A D3 selection of the drawn hosts
 * @param  {jQuery.selection} lines A jQuery selection of the log lines
 * @param  {d3.selection} hh A D3 selection of the hidden hosts
 */
Controller.prototype.bind = function(nodes, hosts, lines, hh) {
    var controller = this;

    if (nodes) {
        nodes.on("click", function(e) {
            if (d3.event.shiftKey) {
                var dtfs = controller.defaultTransformations;
                dtfs.filter(function(t) {
                    return t.constructor == CollapseSequentialNodesTransformation;
                }).forEach(function(t) {
                    t.toggleExemption(e.getNode());
                });

                controller.transform();
                controller.global.drawAll();
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
                var existing = controller.transformations.filter(function(t) {
                    return t.constructor == HighlightHostTransformation && t.host == e.getHost();
                })[0];

                if (existing) {
                    var hightfs = controller.transformations.filter(function(t) {
                        return t.constructor == HighlightHostTransformation;
                    });

                    hightfs.forEach(function(t) {
                        t.getHiddenHosts().forEach(function(h) {
                            controller.global.removeHiddenHost(h);
                        });
                    });

                    controller.removeTransformation(existing);
                    controller.transform();

                    controller.transformations.filter(function(t) {
                        return t.constructor == HighlightHostTransformation;
                    }).forEach(function(t) {
                        t.getHiddenHosts().forEach(function(h) {
                            controller.global.addHiddenHost(h);
                        });
                    });

                    controller.global.drawAll();
                    controller.global.drawAll();
                    return;
                }

                var vms = controller.global.getVisualModels();
                if (vms.length > 1)
                    return;

                var hightf = new HighlightHostTransformation(vms[0], e.getHost());
                controller.addTransformation(hightf);
                controller.transform();
                hightf.getHiddenHosts().forEach(function(h) {
                    controller.global.addHiddenHost(h);
                })
                controller.global.drawAll();
            } else {
                var models = controller.global.getVisualModels();
                for (var i in models) {
                    var hhtf = new HideHostTransformation(models[i], e.getHost());
                    controller.global.addHiddenHost(e.getHost());
                    controller.addTransformation(hhtf);
                }

                controller.transform();
                controller.global.drawAll();
                controller.global.drawAll();
            }
        });
    }

    if (lines) {
        lines.unbind().on("mouseover", function() {
            var id = "#node" + $(this).data("id");
            $(id)[0].dispatchEvent(new MouseEvent("mouseover"));
        });
    }

    if (hh) {
        hh.on("dblclick", function(e) {
            var high = controller.transformations.filter(function(t) {
                return t.constructor == HighlightHostTransformation && t.getHiddenHosts().indexOf(e) > -1;
            });

            if (high.length > 0) {
                controller.transformations.filter(function(t) {
                    return t.constructor == HighlightHostTransformation;
                }).forEach(function(t) {
                    t.getHiddenHosts().forEach(function(h) {
                        controller.global.removeHiddenHost(h);
                    });
                });

                high.forEach(function(h) {
                    controller.removeTransformation(h);
                });

                controller.transform();
                controller.transformations.filter(function(t) {
                    return t.constructor == HighlightHostTransformation;
                }).forEach(function(t) {
                    t.getHiddenHosts().forEach(function(h) {
                        controller.global.addHiddenHost(h);
                    });
                });

                controller.global.drawAll();
                controller.global.drawAll();
            }

            controller.removeTransformation(function (t) {
                return t.constructor == HideHostTransformation && t.host == e;
            });
            controller.transform();
            controller.global.removeHiddenHost(e);
            controller.global.drawAll();
            controller.global.drawAll();
        }).on("mouseover", function(e) {
            $("#curNode").text(e);
        });
    }
}