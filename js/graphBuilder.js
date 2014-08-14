var $hover = $("#panel .hover");

function GraphBuilder($svg) {
    
    this.$svg = $svg;
    
    this.hosts = [];
    
//    this.nodes = [];

    this.bind();
    
    var context = this;
    
    $(".add").click(function () {
        context.addHost();
    });
    
    this.addHost();
    this.addHost();
}

GraphBuilder.prototype.getSVG = function() {
    return this.$svg;
};

GraphBuilder.prototype.addHost = function() {
    this.hosts.push(new GraphBuilderHost(this, this.hosts.length));
    
    this.$svg.width(this.hosts.length * 65);
};

GraphBuilder.prototype.removeHost = function (host) {
    
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
    Host.colors.push(this.color);

    host.removeAllNodes();
    
    host.rect.remove();
    host.line.remove();

    this.$svg.width(this.hosts.length * 65);
    $(".add").css("background", Host.colors[Host.colors.length - 1]);
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

GraphBuilder.prototype.bind = function() {
    
    var context = this;
    
    context.$svg.unbind().on("mousemove", function (e) {
        var x = e.offsetX || (e.pageX - context.$svg.offset().left);
        var y = e.offsetY || (e.pageY - context.$svg.offset().top);

        var arr = [];
        context.hosts.forEach(function (h) {
            dy = Math.max(62.5, Math.round((y - 12.5) / 50) * 50 + 12.5);
            arr.push([h.x, dy]);
            arr.push([h.x, dy - 50]);
            arr.push([h.x, dy + 50]);
        });
        arr = arr.filter(isValid);
        var c = closest(arr, x, y);

        if (!c.x) return;

        if (y < 25 || c.y < 25)
            $hover.hide().hidden = true;
        else
            $hover.show().hidden = false;

        var color = Array.find(context.hosts, function (h) {
            return h.x == c.x;
        }).color;

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
            $c.mousedown();
            n.properties();
        }
    });

    $("circle:not(.hover)").unbind().on("mousedown", function () {
        var parent = this.node;
        var $line = SVGElement("line").attr({
            "x1": $(this).attr("cx"),
            "y1": $(this).attr("cy"),
            "x2": $(this).attr("cx"),
            "y2": $(this).attr("cy")
        }).prependTo(context.$svg);

        parent.state = "active";

        context.$svg.on("mousemove", function (e) {
            if ($hover.hidden) {
                $line.hide();
                return;
            } else {
                $line.show();
            }

            var x = e.offsetX || (e.pageX - context.$svg.offset().left);
            var y = e.offsetY || (e.pageY - context.$svg.offset().top);

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
                var child = context.getHostByX(hx).addNode(hy, true);
                child.properties();
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
            if ($t[0] == context.$svg[0] || $t.parents("svg").length)
                return;
            $line.remove();
            context.getHostByNode(parent).removeNode(parent);
            context.bind();
        });
    }).on("click", function (e) {
        e.target.node.properties();
    });
    
    
    function isValid(c) {
        var n = Array.find(context.getNodes(), function (n) {
            return n.state && (!(n.x == c[0]) != !(n.y == c[1]));
        });

        return n === undefined;
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

GraphBuilder.prototype.convert = function() {
    var s = "";

    this.hosts.forEach(function (h, i) {
        h.name = String.fromCharCode(97 + i);
        h.nodes.sort(function (a, b) {
            return a.y > b.y;
        }).forEach(function (n, i) {
            n.name = h.name + (i + 1);
            n.clock = {};
            n.clock[h.name] = i + 1;
        });
    });

    this.getNodes().forEach(function (n) {
        n.children.forEach(function (c) {
            for (var h in n.clock) {
                if (c.clock[h] == undefined || n.clock[h] > c.clock[h])
                    c.clock[h] = n.clock[h];
            }
        });
    });

    this.hosts.forEach(function (h) {
        var clock = {};
        h.nodes.forEach(function (n) {
            for (var m in n.clock) {
                if (clock[m] == undefined || n.clock[m] > clock[m])
                    clock[m] = n.clock[m];
            }
            n.clock = clock;
            s += n.name + '\n' + h.name + ' ' + JSON.stringify(n.clock) + '\n';
        });
    });

    $(".out").text(s);
};

function convertToBG() {
    var bg = new BuilderGraph(hosts.map(function(h) {
        return h.name;
    }));

    hosts.forEach(function(h) {
        var head = bg.getHead(h.name);
        var curr = head;
        h.nodes.forEach(function(n) {
            var bn = new BuilderNode();
            n.bn = bn;
            curr.insertNext(bn);
            curr = n.bn;
        });
    });

    nodes.forEach(function(n) {
        n.children.sort(function(a, b) {
            return a.y < b.y;
        }).forEach(function(m) {
            n.bn.addChild(m.bn);
        });
    });

    return bg;
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

function SVGElement(tag) {
    return $(document.createElementNS("http://www.w3.org/2000/svg", tag));
}


