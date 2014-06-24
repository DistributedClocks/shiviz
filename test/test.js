function assert (description, outcome) {
    var result;
    try {
        result = outcome();
    } catch (e) {
        var li = document.createElement('li');
        li.className = 'fail';
        li.appendChild(document.createTextNode(description));

        var err = document.createElement('pre');
        err.className = 'err';
        if (e.stack)
            err.appendChild(document.createTextNode(e.stack.replace(/(^|\n)/g, '$1        ')));
        else
            err.appendChild(document.createTextNode("         " + e));

        li.appendChild(err);
        document.getElementById('output').appendChild(li);

        return;
    }

    var li = document.createElement('li');
    li.className = result ? 'pass' : 'fail';
    li.appendChild(document.createTextNode(description));
    document.getElementById('output').appendChild(li);
};

function beginSection (section) {
    var h1 = document.createElement('h1');
    h1.appendChild(document.createTextNode(section));
    document.getElementById('output').appendChild(h1);
}

var start = Date.now();

var log = 'a1\na {"a":1}\na2\na {"a":2,"b":2}\nb1\nb {"b":1,"a":1}\nb2\nb {"b":2,"a":1}';
var lines = log.split('\n');
var graph = generateGraphFromLog(lines);

/**
 * Graph.js
 */

beginSection("Graph.js");

assert("getHead for existent hosts", function () {
    return graph.getHead("a") && graph.getHead("b");
});

assert("getHead for non-existent host", function () {
    return graph.getHead("c") === null;
});

assert("getTail for existent hosts", function () {
    return graph.getTail("a") && graph.getTail("b");
});

assert("getTail for non-existent hosts", function () {
    return graph.getTail("c") === null;
});

assert("getHosts", function () {
    var hosts = graph.getHosts();
    return hosts
    && hosts.length == 2
    && hosts[0] == "a"
    && hosts[1] == "b";
});

assert("getNodes", function () {
    return graph.getNodes()
    && graph.getNodes().length == 4;
});

assert("getDummyNodes", function () {
    var nodes = graph.getDummyNodes();
    return nodes
    && nodes.length == 4
    && nodes.indexOf(graph.getHead("a")) > -1
    && nodes.indexOf(graph.getHead("b")) > -1
    && nodes.indexOf(graph.getTail("a")) > -1
    && nodes.indexOf(graph.getTail("b")) > -1;
});

assert("getAllNodes", function () {
    return graph.getAllNodes()
    && graph.getAllNodes().length == 8;
});

assert("clone", function () {
    var clone = graph.clone();
    return clone
    && (function () {
        var result = true;
        for (var i in clone.getHosts())
            result = result && clone.getHosts()[i] == graph.getHosts()[i];
        return result;
    })()
    && clone.getNodes().length == graph.getNodes().length
    && clone.getDummyNodes().length == graph.getDummyNodes().length
    && clone.getAllNodes().length == graph.getAllNodes().length;
});

assert("removeHost", function () {
    graph.removeHost("a");
    return graph.getHosts().length == 1
    && graph.getHosts()[0] == "b"
    && graph.getNodes().length == 2
    && graph.getDummyNodes().length == 2
    && graph.getAllNodes().length == 4;
});

/**
 * Node
 */

beginSection("Node.js");
graph = generateGraphFromLog(lines);

assert("getId", function () {
    return graph.getNodes()[0].getId();
});

assert("getLogEvents", function () {
    var result = true;
    for (var i in graph.getNodes()) {
        var log = graph.getNodes()[i].getLogEvents();
        result = result && log && log.length == 1;
    }
    return result;
});

assert("getHost", function () {
    var result = true;
    for (var i = 0; i < 2; i++)
        result = result && graph.getNodes()[i].getHost() == "a";
    for (; i < 4; i++)
        result = result && graph.getNodes()[i].getHost() == "b";
    return result;
});

assert("isHead", function () {
    var result = true;
    for (var i in graph.getHosts())
        result = result && graph.getHead(graph.getHosts()[i]).isHead();
    return result;
});

assert("isTail", function () {
    var result = true;
    for (var i in graph.getHosts())
        result = result && graph.getTail(graph.getHosts()[i]).isTail();
    return result;
});

assert("getNext", function () {
    return graph.getNodes()[0].getNext() == graph.getNodes()[1];
});

assert("getPrev", function () {
    return graph.getNodes()[1].getPrev() == graph.getNodes()[0];
});

assert("hasChildren", function () {
    return graph.getNodes()[0].hasChildren()
    && !graph.getNodes()[1].hasChildren()
    && !graph.getNodes()[2].hasChildren()
    && graph.getNodes()[3].hasChildren();
});

assert("hasParents", function () {
    return !graph.getNodes()[0].hasParents()
    && graph.getNodes()[1].hasParents()
    && graph.getNodes()[2].hasParents()
    && !graph.getNodes()[3].hasParents();
});

assert("getChildren", function () {
    var node = graph.getNodes()[0];
    return node.getChildren()
    && node.getChildren().length == 1
    && node.getChildren()[0] == graph.getNodes()[2];
});

assert("getParents", function () {
    var node = graph.getNodes()[1];
    return node.getParents()
    && node.getParents().length == 1
    && node.getParents()[0] == graph.getNodes()[3];
});

assert("getChildByHost for existent child", function () {
    var node = graph.getNodes()[0];
    return node.getChildByHost("b")
    && node.getChildByHost("b") == graph.getNodes()[2];
});

assert("getChildByHost for non-existent child", function () {
    return graph.getNodes()[0].getChildByHost("c") == null;
});

assert("getParentByHost for existent child", function () {
    var node = graph.getNodes()[1];
    return node.getParentByHost("b")
    && node.getParentByHost("b") == graph.getNodes()[3];
});

assert("getParentByHost for non-existent child", function () {
    return graph.getNodes()[1].getParentByHost("c") == null;
});

assert("removeChild for existent child", function () {
    graph.getNodes()[0].removeChild(graph.getNodes()[2]);
    return graph.getNodes()[0].getChildren().length == 0;
});

assert("removeChild for non-existent child", function () {
    graph.getNodes()[3].removeChild(graph.getNodes()[0]);
    return graph.getNodes()[3].getChildren().length == 1;
});

assert("addChild for valid child", function () {
    graph.getNodes()[0].addChild(graph.getNodes()[2]);
    return graph.getNodes()[0].getChildren().length == 1;
});

assert("addChild for invalid child", function () {
    try {
        graph.getNodes()[0].addChild(graph.getNodes()[1]);
    } catch (e) {
        return e.indexOf("cannot be the child") > -1;
    }
    return false;
});

assert("removeParent for existent parent", function () {
    graph.getNodes()[2].removeParent(graph.getNodes()[0]);
    return graph.getNodes()[0].getParents().length == 0;
});

assert("removeParent for non-existent parent", function () {
    graph.getNodes()[1].removeParent(graph.getNodes()[2]);
    return graph.getNodes()[1].getParents().length == 1;
});

assert("addParent for valid parent", function () {
    graph.getNodes()[2].addParent(graph.getNodes()[0]);
    return graph.getNodes()[2].getParents().length == 1;
});

assert("addParent for invalid parent", function () {
    try {
        graph.getNodes()[0].addParent(graph.getNodes()[1]);
    } catch (e) {
        return e.indexOf("cannot be the parent") > -1;
    }
    return false;
});

/**
 * Global
 */
beginSection("Global.js");
$("body").append($("<div id='sideBar'></div>"));
$("body").append($("<div id='reference'></div>"));
var global = new Global();
var view = new View(graph, global, "lable");

assert("addView", function () {
    global.addView(view);
    return global.views.length == 1;
});

assert("getHostColors", function () {
    var colors = global.getHostColors();
    return colors.a && colors.b;
});

assert("drawSideBar", function () {
    global.drawSideBar();
    var $svg = $("#sideBar svg");
    var $text = $("#sideBar text");
    var $line = $("#sideBar line");

    var sw = $svg.width() == 60;
    var sh = $svg.height() == 200;
    var t = $text.text() == "Time";
    var ly = $line.attr("y2") - $line.attr("y1") == 70;
    var lx = $line.attr("x1") == $line.attr("x2");

    $svg.remove();

    return sw && sh && t && ly && lx;
});

/**
 * View
 */
beginSection("View.js");

assert("getGlobal", function () {
    return view.getGlobal() === global;
});

assert("getHosts", function () {
    var hosts = view.getHosts();
    return hosts.length == 2 && hosts[0] == "a" && hosts[1] == "b";
});

$("body").append("<div id='vizContainer'></div>");
$("body").append("<div id='hostBar'></div>");
view.draw();
var $svg = $("#vizContainer svg");
var $hostBar = $("#hostBar");
var $hosts = $("#hostBar rect:not(:first-child)");
var $circles = $("svg circle");
var $lines = $("svg line");

assert("draw: component count", function () {
    var h = $hosts.length == 2;
    var c = $circles.length == 4;
    var l = $lines.length == 6;

    return h && c && l;
});

assert("draw: host ordering", function () {
    var first = $circles.sort(function (a, b) {
        return a.getAttribute("cx") < b.getAttribute("cx");
    })[0];
    return first.__data__.node.host == "a";
});

assert("draw: host colors", function () {
    return $hosts[0].getAttribute("fill") == global.getHostColors().a;
});

assert("draw: node ordering", function () {
    var a = $circles.filter(function (i, c) {
        return c.getAttribute("class") == "a";
    });
    var b = $circles.filter(function (i, c) {
        return c.getAttribute("class") == "b";
    });

    var la = $(a[0]).offset().top < $(a[1]).offset().top;
    var lb = $(b[0]).offset().top < $(b[1]).offset().top;
    var ab = $(a[0]).offset().top < $(b[0]).offset().top;
    var ba = $(b[1]).offset().top < $(a[1]).offset().top;

    return la && lb && ab && ba;
});

$("#vizContainer").remove();
$hostBar.remove();

console.log(Date.now() - start);