function GraphBuilder(searchbox) {

    this.searchbox = searchbox;
    
    this.conversionLocked = false;
    
    this.$svg = $("#panel svg");
    this.$hover = this.$svg.find(".hover");
    
    this.hosts = [];
    this.colors = [
        "rgb(122,155,204)",
        "rgb(122,204,155)",
        "rgb(187,204,122)",
        "rgb(204,122,122)",
        "rgb(187,122,204)",
        "rgb(122,155,204)"
    ];
    
    this.bind();
    this.addHost();
    this.addHost();
}

GraphBuilder.MAX_HOSTS = 7;
GraphBuilder.START_OFFSET = 62.5;
GraphBuilder.Y_SPACING = 50;
GraphBuilder.BOX = 25;
GraphBuilder.HALF_BOX = GraphBuilder.BOX / 2;

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
        nodeToY[n.getId()] = GraphBuilder.START_OFFSET + GraphBuilder.Y_SPACING * 2;
    });

    var next = nodes.filter(function(n) {
        return !nodeToParents[n.getId()];
    });

    while (next.length) {
        var curr = next.pop();

        var node = hostMap[curr.getHost()].addNode(nodeToY[curr.getId()]);
        nodeToGBNode[curr.getId()] = node;

        var cnext = curr.getNext().isTail() ? [] : [curr.getNext()];
        var children = curr.getChildren().concat(cnext);

        children.forEach(function(n) {
            var id = n.getId();
            
            var numParents = --nodeToParents[id];
            nodeToY[id] = Math.max(nodeToY[id], nodeToY[curr.getId()] + GraphBuilder.Y_SPACING);

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
};

GraphBuilder.prototype.getSVG = function() {
    return this.$svg;
};

GraphBuilder.prototype.addHost = function() {
    
    if (this.hosts.length >= GraphBuilder.MAX_HOSTS) {
        throw new Exception("GraphBuilder.prototype.addHost: no new hosts may be added");
    }
    
    var host = new GraphBuilderHost(this, this.hosts.length);
    this.hosts.push(host);

    this.$svg.width(this.hosts.length * 65);
    
    if (this.hosts.length == GraphBuilder.MAX_HOSTS) {
        $(".add").attr("disabled", true);
    } else {
        $(".add").css("background", this.colors[this.colors.length - 1]);
    }

    return host;
};

GraphBuilder.prototype.removeHost = function(host) {
    
    Array.remove(this.hosts, host);
    
    this.hosts.forEach(function (h, i) {
        h.rx = i * 65;
        h.x = h.rx + 12.5;
        h.rect.attr("x", h.rx);
        h.line.attr({
            "x1": h.x,
            "x2": h.x
        });

        h.nodes.forEach(function (n) {
            n.lines.forEach(function (l) {
                if (l.line.attr("x1") == n.x)
                    l.line.attr("x1", h.x);
                else
                    l.line.attr("x2", h.x);
            });
            n.x = h.x;
            n.circle.attr("cx", h.x);
        });
    });

    this.colors.push(host.color);
    host.removeAllNodes();
    
    host.rect.remove();
    host.line.remove();

    this.$svg.width(this.hosts.length * 65);
    $(".add").css("background", this.colors[this.colors.length - 1]);
    $(".add").removeAttr("disabled");

    this.convert();
};

GraphBuilder.prototype.getHostByX = function(x) {
    for(var i = 0; i < this.hosts.length; i++) {
        if(this.hosts[i].x == x) {
            return this.hosts[i];
        }
    }
    return null;
};

GraphBuilder.prototype.getHostByNode = function(node) {
    for(var i = 0; i < this.hosts.length; i++) {
        if(this.hosts[i].x == node.x) {
            return this.hosts[i];
        }
    }
    return null;
};

GraphBuilder.prototype.getNodes = function() {
    var nodes = [];
    this.hosts.forEach(function(host) {
        nodes = nodes.concat(host.nodes);
    });
    return nodes;
};

GraphBuilder.prototype.getNodeByCoord = function(x, y) {
    var nodes = this.getNodes();
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(node.x == x && node.y == y) {
            return node;
        }
    }
    return null;
};

GraphBuilder.prototype.clear = function() {
    while (this.hosts.length > 0)
        this.removeHost(this.hosts[this.hosts.length - 1]);

    this.addHost();
    this.addHost();
};

GraphBuilder.prototype.bind = function() {
    
    var context = this;
    var $svg = this.$svg;
    var $hover = this.$hover;

    $(".add").unbind().click(function () {
        context.addHost();
    });
    
    $svg.unbind().on("mousemove", function (e) {
        var x = e.offsetX || (e.pageX - $svg.offset().left);
        var y = e.offsetY || (e.pageY - $svg.offset().top);

        var arr = [];
        context.hosts.forEach(function (h) {
            var y_int = Math.round((y - GraphBuilder.HALF_BOX) / GraphBuilder.Y_SPACING);
            var snap_y = y_int * GraphBuilder.Y_SPACING + GraphBuilder.HALF_BOX;

            dy = Math.max(GraphBuilder.START_OFFSET, snap_y);
            arr.push([h.x, dy]);
            arr.push([h.x, dy - GraphBuilder.Y_SPACING]);
            arr.push([h.x, dy + GraphBuilder.Y_SPACING]);
        });
        arr = arr.filter(isValid);

        var c = closest(arr, x, y);

        if (!c.x) return;

        if (y < GraphBuilder.BOX || c.y < GraphBuilder.BOX) {
            $hover.hide().hidden = true;
        } else {
            $hover.show().hidden = false;
        }

        var color = context.getHostByX(c.x).getColor();

        $hover.attr({
            "cx": c.x,
            "cy": c.y,
            "fill": color
        });
    }).on("mousedown", function (e) {
        var hx = $hover.attr("cx"), hy = $hover.attr("cy");
        var existing = context.getNodeByCoord(hx, hy);

        if (!existing && !$hover.hidden) {
            var n = context.getHostByX(hx).addNode(hy, true);
            var $c = $(n.circle);
            context.convert();
            $c.mousedown();
        }
    }).on("mouseout", function (e) {
        var $t = $(e.relatedTarget);
        if ($t[0] == $svg[0] || $t.parents("svg").length)
            return;
        $hover.hide();
    });

    $("circle:not(.hover)").unbind().on("mousedown", function () {
        var parent = this.node;
        var $line = Util.svgElement("line").attr({
            "x1": $(this).attr("cx"),
            "y1": $(this).attr("cy"),
            "x2": $(this).attr("cx"),
            "y2": $(this).attr("cy")
        }).prependTo($svg);

        parent.state = "active";

        $svg.on("mousemove", function (e) {
            if ($hover.hidden) {
                $line.hide();
                return;
            } else {
                $line.show();
            }

            var x = e.offsetX || (e.pageX - $svg.offset().left);
            var y = e.offsetY || (e.pageY - $svg.offset().top);

            var a = context.getNodes().map(function (n) {
                return [n.x, n.y];
            }).filter(isValid).concat([[$hover.attr("cx"), $hover.attr("cy")]]);

            var c = closest(a, x, y);

            $line.attr({
                "x2": c.x,
                "y2": c.y
            });
        }).on("mouseup", function () {
            var hx = $hover.attr("cx"), hy = $hover.attr("cy");
            var existing = context.getNodeByCoord(hx, hy);

            if (!existing && !$hover.hidden) {
                var child = context.getHostByX(hx).addNode(hy, false);

                if (parent.y < child.y)
                    parent.addChild(child, $line);
                else
                    child.addChild(parent, $line);
            } else {
                if (existing == parent) {
                    $line.remove();
                } else {
                    if (parent.y < existing.y)
                        parent.addChild(existing, $line);
                    else
                        existing.addChild(parent, $line);
                }
            }

            parent.state = false;
            context.bind();
        }).on("mouseout", function (e) {
            var $t = $(e.relatedTarget);
            if ($t[0] == $svg[0] || $t.parents("svg").length)
                return;
            $line.remove();
            context.getHostByNode(parent).removeNode(parent);
            context.convert();
            context.bind();
        });
    });
    
    function isValid(c) {
        var n = Array.find(context.getNodes(), function (n) {
            return n.state && (!(n.x == c[0]) != !(n.y == c[1]));
        });

        return n === undefined;
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

Array.find = function (arr, arg) {
    if (arg.constructor == Function)
        return arr.filter(arg)[0];
    else
        return arr[arr.indexOf(arg)];
};

Array.remove = function (arr, arg) {
    if (arg.constructor == Function) {
        var f;
        while (f = arr.find(arg))
            Array.remove(arr, f);
        return;
    }

    arr.splice(arr.indexOf(arg), 1);
};

GraphBuilder.prototype.lockConversion = function() {
    this.conversionLocked = true;
};

GraphBuilder.prototype.unlockConversion = function() {
    this.conversionLocked = false;
};

GraphBuilder.prototype.convert = function() {
    
    if (this.conversionLocked)
        return;
    
    var vts = new VectorTimestampSerializer("{\"host\":\"`HOST`\",\"clock\":`CLOCK`}", ",", "#motif=[", "]");
    var builderGraph = this.convertToBG();
    this.searchbox.setValue(vts.serialize(builderGraph.toVectorTimestamps()));
    this.searchbox.update(true);
};

GraphBuilder.prototype.convertToBG = function() {
    
    var hosts = this.hosts.map(function(gbHost) {
        return gbHost.getName();
    });
    
    var builderGraph = new BuilderGraph(hosts);
    var gbNodeToBuilderNode = {};
    
    this.hosts.forEach(function(gbHost) {
        var tail = builderGraph.getTail(gbHost.getName());
        
        gbHost.getNodesSorted().forEach(function(gbNode) {
           var builderNode = new BuilderNode();
           gbNodeToBuilderNode[gbNode.getId()] = builderNode;
           tail.insertPrev(builderNode);
        });
    });
    
    this.getNodes().forEach(function(gbNode) {
        var builderNode = gbNodeToBuilderNode[gbNode.getId()];
       gbNode.getChildren().sort(function(a, b){
           return a.y - b.y;
       }).forEach(function(child) {
           builderNode.addChild(gbNodeToBuilderNode[child.getId()]);
       });
    });
    
    return builderGraph;
};
