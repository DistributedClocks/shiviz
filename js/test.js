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
            err.appendChild(document.createTextNode(e.stack.replace(/(^|\n)/g, '$1      ')));
        else
            err.appendChild(document.createTextNode("       " + e));

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

assert("clone", function () {
    var node = graph.getNodes()[0];
    var clone = node.clone();
    return node.getLogEvents().length == clone.getLogEvents().length
    && node.getHost() == clone.getHost()
    && node.isHead() == clone.isHead()
    && node.isTail() == clone.isTail();
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

console.log(Date.now() - start);