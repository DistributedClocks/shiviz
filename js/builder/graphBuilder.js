/**
 * 
 * @classdesc
 * 
 * @constructor
 * @param $svg
 */
function GraphBuilder($svg, $addButton, motifSearch) {

    /** @private */
    this.updateCallback = null;

    /** @private */
    this.conversionLocked = false;

    /** @private */
    this.$svg = $svg;

    this.$addButton = $addButton;

    /** @private */
    this.$hover = this.$svg.find(".hover");

    /** @private */
    this.hosts = [];

    this.cleared = true;

    this.motifSearch = motifSearch;

    /** @private */
    this.colors = [ "rgb(122,155,204)", "rgb(122,204,155)", "rgb(187,204,122)", "rgb(204,122,122)", "rgb(187,122,204)", "rgb(122,155,204)" ];

    if (!motifSearch) {
        this.bindNodes();
        this.addHost();
        this.addHost();
    }
}

/**
 * @static
 * @const
 */
GraphBuilder.MAX_HOSTS = 6;

/**
 * @static
 * @const
 */
GraphBuilder.START_OFFSET = 62.5;

/**
 * @static
 * @const
 */
GraphBuilder.Y_SPACING = 50;

/**
 * @static
 * @const
 */
GraphBuilder.BOX = 25;

/**
 * @static
 * @const
 */
GraphBuilder.HALF_BOX = GraphBuilder.BOX / 2;

/**
 * Replaces the contents of this graph builder with the provided BuilderGraph
 * 
 * @param {BuilderGraph} bg
 */
GraphBuilder.prototype.convertFromBG = function(bg) {
    var context = this;

    while (this.hosts.length > 0)
        this.removeHost(this.hosts[this.hosts.length - 1]);

    var hostMap = {};

    bg.getHosts().forEach(function(h) {
        var host = context.addHost();
        hostMap[h] = host;
    });

    var nodeToParents = {};
    var nodeToY = {};
    var nodeToGBNode = {};

    var nodes = bg.getNodes();
    nodes.forEach(function(n) {
        var head = n.getPrev().isHead() ? 0 : 1;
        nodeToParents[n.getId()] = n.getParents().length + head;
        nodeToY[n.getId()] = (context.motifSearch ? 5 : GraphBuilder.START_OFFSET + GraphBuilder.Y_SPACING * 2);
    });

    var next = nodes.filter(function(n) {
        return !nodeToParents[n.getId()];
    });

    while (next.length) {
        var curr = next.pop();

        var node = hostMap[curr.getHost()].addNode(nodeToY[curr.getId()]);
        nodeToGBNode[curr.getId()] = node;

        var cnext = curr.getNext().isTail() ? [] : [ curr.getNext() ];
        var children = curr.getChildren().concat(cnext);

        children.forEach(function(n) {
            var id = n.getId();

            var numParents = --nodeToParents[id];
            nodeToY[id] = (context.motifSearch ? Math.max(nodeToY[id], nodeToY[curr.getId()] + 20) : Math.max(nodeToY[id], nodeToY[curr.getId()] + GraphBuilder.Y_SPACING));

            if (numParents == 0)
                next.push(n);
        });
    }

    nodes.forEach(function(n) {
        var gbn = nodeToGBNode[n.getId()];
        var children = n.getChildren();
        children.forEach(function(c) {
            var gbc = nodeToGBNode[c.getId()];
            var c1 = gbn.getCoords();
            var c2 = gbc.getCoords();

            var $line = Util.svgElement("line").attr({
                "x1": c1[0],
                "x2": c2[0],
                "y1": c1[1],
                "y2": c2[1]
            }).prependTo(context.$svg);

            gbn.addChild(gbc, $line);
        });
    });

    if (this.motifSearch) {
        this.hosts.forEach(function(host) {
            var sortedNodes = host.getNodesSorted();
            var y1 = sortedNodes[0].getCoords()[1];
            var y2 = sortedNodes[sortedNodes.length - 1].getCoords()[1];
            host.setLineYCoordinates(y1, y2);
        });
    }
};

/**
 * Gets the svg associated with this GraphBuilder as a JQuery object. The svg is
 * what the graph builder is drawn to
 * 
 * @returns {$} The svg as a JQuery object
 */
GraphBuilder.prototype.getSVG = function() {
    return this.$svg;
};

/**
 * Creates and adds a host to this GraphBuilder
 * 
 * @returns {GraphBuilderHost} the newly created and added host
 */
GraphBuilder.prototype.addHost = function() {

    if (this.hosts.length >= GraphBuilder.MAX_HOSTS) {
        throw new Exception("GraphBuilder.prototype.addHost: no new hosts may be added");
    }

    var host = new GraphBuilderHost(this, this.hosts.length, this.motifSearch);
    this.hosts.push(host);

    this.$svg.width(this.hosts.length * 65);

    if (this.$addButton) {
        if (this.hosts.length == GraphBuilder.MAX_HOSTS) {
            this.$addButton.attr("disabled", true);
        }
        else {
            this.$addButton.css("background", this.colors[this.colors.length - 1]);
        }
    }

    return host;
};

/**
 * Removes the provided host from this graph builder
 * 
 * @param {GraphBuilderHost} host the host to remove
 */
GraphBuilder.prototype.removeHost = function(host) {

    Util.removeFromArray(this.hosts, host);
    var hostNum = host.getHostNum();

    // Remove the constraint indicator when removing a host
    host.getConstraintSVG().remove();

    this.hosts.forEach(function(h, i) {
        h.rx = i * 65;
        h.x = h.rx + 12.5;
        h.rect.attr("x", h.rx);
        h.line.attr({
            "x1": h.x,
            "x2": h.x
        });

        h.nodes.forEach(function(n) {
            n.lines.forEach(function(l) {
                if (l.line.attr("x1") == n.x)
                    l.line.attr("x1", h.x);
                else
                    l.line.attr("x2", h.x);
            });
            n.x = h.x;
            n.circle.attr("cx", h.x);
        });

        // update the hostNum
        var currHostNum = h.getHostNum();
        if (currHostNum > hostNum) {
            h.setHostNum(currHostNum - 1);
            h.getConstraintSVG().attr({
                "x": parseFloat(h.getHostSquare().attr("x")) + 8
            });
        }
    });

    this.colors.push(host.color);
    host.removeAllNodes();

    host.rect.remove();
    host.line.remove();

    this.$svg.width(this.hosts.length * 65);

    if (this.$addButton) {
        this.$addButton.css("background", this.colors[this.colors.length - 1]);
        this.$addButton.removeAttr("disabled");
    }
    this.invokeUpdateCallback();
};

/**
 * Retrieves all graph builder hosts associated with this graph builder
 * @returns {Array<GraphBuilderHost>} All hosts
 */
GraphBuilder.prototype.getHosts = function() {
    return this.hosts;
}

/**
 * Retrieves the host whose x coordinate is the one provided
 * 
 * @param {Number} x the x-coord
 * @returns {GraphBuilderHost} the host with the specified x-coordinate
 */
GraphBuilder.prototype.getHostByX = function(x) {
    for (var i = 0; i < this.hosts.length; i++) {
        if (this.hosts[i].x == x) {
            return this.hosts[i];
        }
    }
    return null;
};

/**
 * Retrieves the host that contains the specified node
 * 
 * @param {GraphBuilderNode} node the node whose host you want to find
 * @returns {GraphBuilderHost} the host that contains the specified node
 */
GraphBuilder.prototype.getHostByNode = function(node) {
    for (var i = 0; i < this.hosts.length; i++) {
        if (this.hosts[i].x == node.x) {
            return this.hosts[i];
        }
    }
    return null;
};

/**
 * Gets all of the nodes contained in this graph builder as an array
 * 
 * @returns {Array<GraphBuilderNode>} the nodes in this graph builder
 */
GraphBuilder.prototype.getNodes = function() {
    var nodes = [];
    this.hosts.forEach(function(host) {
        nodes = nodes.concat(host.nodes);
    });
    return nodes;
};

/**
 * Retrieves the node whose coordinates match the specified coordinates
 * 
 * @param {Number} x the x-coordinate
 * @param {Number} y the y-coordinate
 * @returns {GraphBuilderNode} the node with the specified coordinates
 */
GraphBuilder.prototype.getNodeByCoord = function(x, y) {
    var nodes = this.getNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.x == x && node.y == y) {
            return node;
        }
    }
    return null;
};

/**
 * Resets the GraphBuilder to its original state.
 */
GraphBuilder.prototype.clear = function() {
    // Set the cleared field to true so that the callback in searchBar.js does not update the searchbar input
    this.setCleared(true);
    while (this.hosts.length > 0)
        // removeHost invokes the callback function
        this.removeHost(this.hosts[this.hosts.length - 1]);

    // Set the cleared field to false now that callbacks for resetting the GraphBuilder have completed
    // This allows the searchbar input to be updated the next time a user draws something
    this.setCleared(false);
    this.addHost();
    this.addHost();
};

/**
 * Retrieves the cleared field for this GraphBuilder
 * @returns {Boolean} True if this GraphBuilder was reset, false otherwise
 */
GraphBuilder.prototype.isCleared = function() {
    return this.cleared;
}

/**
 * Sets the cleared field for this GraphBuilder
 * @param {Boolean} cleared The boolean value to set
 */
GraphBuilder.prototype.setCleared = function(cleared) {
    this.cleared = cleared;
}

/**
 * Gets the maximum x-coordinate among the nodes in this graphBuilder
 */
GraphBuilder.prototype.getMaxNodeWidth = function() {
    var nodes = this.getNodes();
    var maxWidth = 0;

    nodes.forEach(function(node) {
        var currWidth = node.getCoords()[0];
        if (currWidth > maxWidth) {
            maxWidth = currWidth;
        }
    });

    return maxWidth;
}

/**
 * Gets the maximum y-coordinate among the nodes in this graphBuilder
 */
GraphBuilder.prototype.getMaxNodeHeight = function() {
    var nodes = this.getNodes();
    var maxHeight = 0;

    nodes.forEach(function(node) {
        var currHeight = node.getCoords()[1];
        if (currHeight > maxHeight) {
            maxHeight = currHeight;
        }
    });

    return maxHeight;
}

/**
 * Handles all user interaction with nodes in the graph builder, including:
 *  
 * <ul>
 * <li>Add node on click</li>
 * <li>Drag to add two connected nodes</li>
 * <li>Drag from existing node to new connected node</li>
 * <li>Drag from existing node to existing node to add connection</li>
 * <li>Drag existing node out of drawing area to remove</li>
 * <li>Double click existing node to remove</li>
 * </ul>
 */
GraphBuilder.prototype.bindNodes = function() {

    var context = this;
    var $svg = this.$svg;
    var $hover = this.$hover;

    if (this.$addButton) {
        this.$addButton.unbind().click(function() {
            context.addHost();
        });
    }

    $svg.unbind().on("mousemove", function(e) {
        var x = e.offsetX || (e.pageX - $svg.offset().left);
        var y = e.offsetY || (e.pageY - $svg.offset().top);

        var arr = [];
        context.hosts.forEach(function(h) {
            var y_int = Math.round((y - GraphBuilder.HALF_BOX) / GraphBuilder.Y_SPACING);
            var snap_y = y_int * GraphBuilder.Y_SPACING + GraphBuilder.HALF_BOX;

            dy = Math.max(GraphBuilder.START_OFFSET, snap_y);
            arr.push([ h.x, dy ]);
            arr.push([ h.x, dy - GraphBuilder.Y_SPACING ]);
            arr.push([ h.x, dy + GraphBuilder.Y_SPACING ]);
        });
        arr = arr.filter(isValid);

        var c = closest(arr, x, y);

        if (!c.x)
            return;

        if (y < GraphBuilder.BOX || c.y < GraphBuilder.BOX) {
            $hover.hide().hidden = true;
        }
        else {
            $hover.show().hidden = false;
        }

        var color = context.getHostByX(c.x).getColor();

        $hover.attr({
            "cx": c.x,
            "cy": c.y,
            "fill": color
        });
    }).on("mousedown", function(e) {
        var hx = $hover.attr("cx"), hy = $hover.attr("cy");
        var existing = context.getNodeByCoord(hx, hy);

        if (!existing && !$hover.hidden) {
            var n = context.getHostByX(hx).addNode(hy, true);
            var $c = $(n.circle);
            context.invokeUpdateCallback();
            $c.mousedown();
        }
    }).on("mouseout", function(e) {
        var $t = $(e.relatedTarget);
        if ($t[0] == $svg[0] || $t.parents("svg").length)
            return;
        $hover.hide();
    });

    $svg.find("circle:not(.hover)").unbind().on("mousedown", function() {
        var parent = this.node;

        var $line = Util.svgElement("line").attr({
            "x1": $(this).attr("cx"),
            "y1": $(this).attr("cy"),
            "x2": $(this).attr("cx"),
            "y2": $(this).attr("cy")
        }).prependTo($svg);

        parent.state = "active";

        $svg.on("mousemove", function(e) {
            if ($hover.hidden) {
                $line.hide();
                return;
            }
            else {
                $line.show();
            }

            var x = e.offsetX || (e.pageX - $svg.offset().left);
            var y = e.offsetY || (e.pageY - $svg.offset().top);

            var a = context.getNodes().map(function(n) {
                return [ n.x, n.y ];
            }).filter(isValid).concat([ [ $hover.attr("cx"), $hover.attr("cy") ] ]);

            var c = closest(a, x, y);

            $line.attr({
                "x2": c.x,
                "y2": c.y
            });

        }).on("mouseup", function() {
            var hx = $hover.attr("cx"), hy = $hover.attr("cy");
            var existing = context.getNodeByCoord(hx, hy);

            if (!existing && !$hover.hidden) {
                var child = context.getHostByX(hx).addNode(hy, false);

                if (parent.y < child.y)
                    parent.addChild(child, $line);
                else
                    child.addChild(parent, $line);
            }
            else {
                if (existing == parent) {
                    $line.remove();
                }
                else {
                    if (parent.y < existing.y)
                        parent.addChild(existing, $line);
                    else
                        existing.addChild(parent, $line);
                }
            }

            parent.state = false;
            context.bindNodes();

        }).on("mouseout", function(e) {
            var $t = $(e.relatedTarget);
            if ($t[0] == $svg[0] || $t.parents("svg").length)
                return;
            $line.remove();
            context.getHostByNode(parent).removeNode(parent);
            context.invokeUpdateCallback();
            context.bindNodes();
        });

    }).on("dblclick", function() {
        context.getHostByNode(this.node).removeNode(this.node);

    }).on("click", function() {
        var $circle = $(this);

        $(".eventConstraintDialog").css({
            "left": $circle.attr("cx") + 200
        }).show();

        $("#eventConstraint").css({
            "border-color": $circle.attr("fill"),
            "margin-top": $circle.attr("cy") + 100
        }).focus();
    });

    $("#eventConstraint").unbind("keydown").on("keydown", function(e) {
        switch (e.which) {
        // Return
        case 13:
            $(".eventConstraintDialog").hide();

            // Update the searchbar with the new constraint
            context.invokeUpdateCallback();
            break;
        }
    });

    function isValid(c) {
        var n = context.getNodes().filter(function(n) {
            return n.state && (!(n.x == c[0]) != !(n.y == c[1]));
        });

        return n.length == 0;
    }

    function closest(array, x, y, d) {
        var r = {};
        for (var i = 0; i < array.length; i++) {
            var ix = parseFloat(array[i][0]);
            var iy = parseFloat(array[i][1]);
            var id = Math.sqrt(Math.pow(x - ix, 2) + Math.pow(y - iy, 2));
            if ((!d || id < d) && (r.dist === undefined || id < r.dist)) {
                r.index = i;
                r.dist = id;
                r.x = ix;
                r.y = iy;
            }
        }

        return r;
    }
};

/**
 * Handles user interaction with host squares in the graph builder
 *
 * @param {GraphBuilderHost} host The host to bind events to 
 */
GraphBuilder.prototype.bindHost = function(host) {
    var graphBuilder = this;
    var square = host.getHostSquare();

    square.on("dblclick", function() {
        // Have to pass in host here or the value of "this" in handleHostClick will be for square
        // and we won't be able to access graphBuilder
        graphBuilder.handleHostDblClick(host);
    }).on("click", function() {
        graphBuilder.handleHostClick(host);
    });

    $("#hostConstraint").unbind("keydown").on("keydown", function(e) {
        switch (e.which) {
        // Return
        case 13:
            var currHost = graphBuilder.getHostByX($(this).attr("name"));
            currHost.setConstraint($(this).val().trim());
            $(".hostConstraintDialog").hide();

            // Update the searchbar with the new constraint
            graphBuilder.invokeUpdateCallback();
            break;
        }
    });
}

/**
 * Handles the click event on a host box in a custom structured search by showing the constraint dialog box
 * @param {GraphBuilderHost} host The host whose host box was clicked on
 */
GraphBuilder.prototype.handleHostClick = function(host) {
    $(".hostConstraintDialog").css({
        "left": host.graphBuilder.getSVG().offset().left + host.getX() + 15
    }).show();

    $("#hostConstraint").css({
        "border-color": host.getColor()
    }).val(host.getConstraint()).attr("name", host.getX()).focus();
}

/**
 * Handles the double click event on a host box in a custom structured search by removing the host
 * @param {GraphBuilderHost} host The host whose host box was double clicked on
 */
GraphBuilder.prototype.handleHostDblClick = function(host) {
    host.graphBuilder.removeHost(host);
    $(".hostConstraintDialog").hide();
}

/**
 * Sets the update callback function. The update callback function will be
 * called whenever a change is made to this graph builder
 * 
 * @param {Function} fn a function of zero parameters
 */
GraphBuilder.prototype.setUpdateCallback = function(fn) {
    this.updateCallback = fn;
};

/**
 * Invokes the update callback function
 */
GraphBuilder.prototype.invokeUpdateCallback = function() {
    if (this.updateCallback) {
        this.updateCallback();
    }
};

/**
 * Converts the drawn graph in this graph builder to a BuilderGraph
 * 
 * @returns {BuilderGraph} the resulting BuilderGraph
 */
GraphBuilder.prototype.convertToBG = function() {

    var hosts = this.hosts.map(function(gbHost) {
        return gbHost.getName();
    });

    var hostConstraints = this.hosts.map(function(gbHost) {
        return gbHost.getConstraint() != "";
    });

    var builderGraph = new BuilderGraph(hosts, hostConstraints);
    var gbNodeToBuilderNode = {};

    this.hosts.forEach(function(gbHost) {
        var tail = builderGraph.getTail(gbHost.getName());

        gbHost.getNodesSorted().forEach(function(gbNode) {
            var builderNode = new BuilderNode();
            gbNodeToBuilderNode[gbNode.getId()] = builderNode;
            tail.insertPrev(builderNode);

            var index = hosts.indexOf(builderNode.getHost());
            builderNode.setHasHostConstraint(hostConstraints[index]);
        });
    });

    this.getNodes().forEach(function(gbNode) {
        var builderNode = gbNodeToBuilderNode[gbNode.getId()];
        gbNode.getChildren().sort(function(a, b) {
            return a.y - b.y;
        }).forEach(function(child) {
            builderNode.addChild(gbNodeToBuilderNode[child.getId()]);
        });
    });

    return builderGraph;
};
