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

        all_tests_pass = false; 
        console.log("CRASH: " + description);


        return;
    }

    var li = document.createElement('li');
    li.className = result ? 'pass' : 'fail';
    li.appendChild(document.createTextNode(description));
    document.getElementById('output').appendChild(li);

    if (!result) {                          
        all_tests_pass = false;             
        console.log("FAIL: " + description);
    }                                       


};

function beginSection (section) {
    var h1 = document.createElement('h1');
    h1.appendChild(document.createTextNode(section));
    document.getElementById('output').appendChild(h1);
}

let all_tests_pass = true;

var start = Date.now();

var log = 'a1\na {"a":1}\na2\na {"a":2, "b":2}\nb1\nb {"b":1,"a":1}\nb2\nb {"b":2,"a":1}';
var parser = new LogParser(log, null, new NamedRegExp('(?<event>.*)\\n(?<host>\\S*) (?<clock>{.*})', 'm'));
var hostPermutation = new LengthPermutation(true);
var graph = new ModelGraph(parser.getLogEvents(""));

hostPermutation.addGraph(graph);
hostPermutation.update();

$("body").append("<div class='visualization'><header></header></div>");
$(".visualization").append("<div id='graph'></div>");
$("#graph").append("<div id='hostBar'></div>");
$("#graph").append("<div id='vizContainer'></div>");
$(".visualization").append("<div id='sidebar'></div>");
$(".visualization").append("<div id='logTable'></div>");


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
graph = new ModelGraph(parser.getLogEvents(""));

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
        return e.rawString.indexOf("cannot be the child") > -1;
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
        return e.rawString.indexOf("cannot be the parent") > -1;
    }
    return false;
});

/**
 * Text search
 */

beginSection("LEM.js");

testQuery("simple implicit query 1", "c", "abcd", {}, true);
testQuery("simple implicit query 2", "e", "abcd", {}, false);
testQuery("field query 1", "asdf = 4", "", {asdf:4}, true);
testQuery("field query 2", "asdf = 5", "", {asdf:4}, false);
testQuery("field query 3", "asdf != 5", "", {asdf:4}, true);
testQuery("paren query 1", "(a)", "a", {}, true);
testQuery("paren query 2", "(b)", "a", {}, false);
testQuery("paren query 3", "(((((a)))))", "a", {}, true);
testQuery("regex query 1", "abc=/^([a-z][0-9])+$/", "", {abc:"a8k4h2g5p0"}, true);
testQuery("regex query 1", "abc=/^([a-z][0-9])+$/", "", {abc:"a8ka4h2g5p0"}, false);
testQuery("and query 1", "a = 1 && b = 2", "a", {a:1, b:2, c:3}, true);
testQuery("and query 2", "a = 1 && c = 2", "a", {a:1, b:2, c:3}, false);
testQuery("or query 1", "a = 1 || b = 9", "a", {a:1, b:2, c:3}, true);
testQuery("and query 2", "a = 9 || b = 21", "a", {a:1, b:2, c:3}, false);
testQuery("precedence query test 1", "a || b && c", "asdf", {}, false);
testQuery("precedence query test 2", "a || (b && c)", "asdf", {}, true);

function testQuery(description, query, log, fields, expected) {
    assert(description, function() {
        var vt = new VectorTimestamp({"a": 1}, "a");
        var le = new LogEvent(log, vt, 1, fields);
        
        try{
        var lem = new LogEventMatcher(query);
        }
        catch(e) {
            console.log(e);
        }
        
        return lem.match(le) == expected;
    });
}

graph = new ModelGraph(parser.getLogEvents(""));
var viewL = new View(graph, hostPermutation, "viewL");
var viewR = new View(graph, hostPermutation, "viewR");
var views = [viewL, viewR];

var global = new Global($("#vizContainer"), $("#sidebar"), $("#hostBar"), $("#logTable"), views);
global.setHostPermutation(hostPermutation);

/**
 * View
 */
beginSection("View.js");
viewL.draw("L");

var $hosts = $("rect", viewL.getHostSVG());
var $circles = $("circle", viewL.getSVG());
var $links = $("line", viewL.getSVG());

assert("getHosts", function () {
    var hosts = viewL.getHosts();
    return hosts.length == 2 && hosts[0] == "a" && hosts[1] == "b";
});

assert("getModel", function () {
    return viewL.getModel() == graph;
});

assert("draw: component count", function () {
    var h = $hosts.length == 2;
    var c = $circles.length == 4;
    var l = $links.length == 6;
    return h && c && l;
});

/**
 * Abbreviation
 */
beginSection("Abbreviation.js");

/**
 * Aids in testing Abbreviation.generateFromStrings.
 * Supply a Map where keys are the input strings and the values are the
 * ellipsified output strings assuming there is a maximum string length of 8
 * non-Ellipsis characters.
 *
 * @param {Map(String:String) => }
 */
function testAbbreviation(testName, inputStringsToAbbrevStringMap) {

    // Return true when the string has fewer than 8 characters, or 8 characters
    // plus two ellipses. (Note: isFit can be any predicate function, including
    // one dependent on the DOM.)
    function testIsFit(string) {
        let maxLen = 8;
        if (string.startsWith(Abbreviation.ELLIPSIS)) {
            maxLen += Abbreviation.ELLIPSIS.length;
        }
        if (string.endsWith(Abbreviation.ELLIPSIS)) {
            maxLen += Abbreviation.ELLIPSIS.length;
        }
        const isFit = string.length <= maxLen;
        return isFit;
    }

    const stringsToFitter = new Map();
    for (let [string,abbrev] of inputStringsToAbbrevStringMap) {
        stringsToFitter.set(string, testIsFit);    
    }

    const abbreviations = Abbreviation.generateFromStrings(stringsToFitter);

    let isPass = true;
    for (let abbrev of abbreviations) {
        let string = abbrev.getOriginalString();
        let abbrevString = abbrev.getEllipsesString();
        if (inputStringsToAbbrevStringMap.get(string) !== abbrevString) {
            isPass = false;
            console.log("Abbreviation failure for '" + string +
                "'. Expected: '" + inputStringsToAbbrevStringMap.get(string) +
                "'; Actual: '" + abbrevString + "'");
            console.log("   Failed Abbreviation: ", abbrev);
            console.log("   inputStringsToAbbrevStringMap:", inputStringsToAbbrevStringMap);
        }
    }

    assert(testName, function() { return isPass; });
}

testAbbreviation("empty", new Map());
testAbbreviation("short one", new Map([["a", "a"]])); 
testAbbreviation("obvious prefix", new Map([
    ["node1", "..1"],
    ["node2", "..2"],
    ["node3", "..3"],
]));
testAbbreviation("obvious suffix", new Map([
    ["a-node", "a.."],
    ["b-node", "b.."],
    ["c-node", "c.."],
]));
testAbbreviation("equal commonplace suffix and prefix", new Map([
    ["hello-1234node", "..1234node"],
    ["hello-5678node", "..5678node"],
    ["hello-9012node", "..9012node"],
])); // There can only be one affix, so it the prefix is chosen arbitrarily
testAbbreviation("more prefixes than suffixes", new Map([
    ["hello-1234", "..1234"],
    ["hello-5678", "..5678"],
    ["hello-9012", "..9012"],
    ["hello-3456", "..3456"],
    ["a-node", "a-node"],
    ["b-node", "b-node"],
    ["c-node", "c-node"],
]));
testAbbreviation("more suffixes than prefixes", new Map([
    ["hello-1", "hello-1"],
    ["hello-2", "hello-2"],
    ["hello-3", "hello-3"],
    ["a-node", "a.."], 
    ["b-node", "b.."], 
    ["c-node", "c.."], 
    ["d-node", "d.."], 
]));
testAbbreviation("one name IS prefix", new Map([
    ["hello-1234", "..-1234"],
    ["hello-5678", "..-5678"],
    ["hello-9012", "..-9012"],
    ["hello", "hello"],
]));
testAbbreviation("long, un-affixed strings", new Map([
    ["abcdefhijklmnopqrstuvwxyz", "..jklmnopq.."],
    ["bcdefhijklmnopqrstuvwxyza", "..klmnopqr.."],
    ["cdefhijklmnopqrstuvwxyzab", "..lmnopqrs.."],
    ["defhijklmnopqrstuvwxyzabc", "..mnopqrst.."],
]));
testAbbreviation("right truncation", new Map([
    ["abcdefghijklmnopqrstuvwxyz-node", "abcdefgh.."],
    ["bcdefghijklmnopqrstuvwxyza-node", "bcdefghi.."],
    ["cdefghijklmnopqrstuvwxyzab-node", "cdefghij.."],
    ["defghijklmnopqrstuvwxyzabc-node", "defghijk.."],
]));
testAbbreviation("left truncation", new Map([
    ["node-abcdefhijklmnopqrstuvwxyz", "..stuvwxyz"],
    ["node-bcdefhijklmnopqrstuvwxyza", "..tuvwxyza"],
    ["node-cdefhijklmnopqrstuvwxyzab", "..uvwxyzab"],
    ["node-defhijklmnopqrstuvwxyzabc", "..vwxyzabc"],
]));
testAbbreviation("several prefix contenders", new Map([
    ["hello-1234", "..1234"],
    ["hello-5678", "..5678"],
    ["hello-9012", "..9012"],
    ["hello-3456", "..3456"],
    ["node-xxx", "node-xxx"],
    ["node-yyy", "node-yyy"], 
    ["node-zzz", "node-zzz"], 
    ["test-aaa", "test-aaa"], 
    ["test-bbb", "test-bbb"], 
    ["test-ccc", "test-ccc"], 
]));
testAbbreviation("complex", new Map([
    ["hello", "hello"],
    ["hello-1234", "..-1234"],
    ["hello-3456", "..-3456"],
    ["hello-3456789012", "..56789012"],
    ["hello-5678", "..-5678"],
    ["hello-9012", "..-9012"],

    ["node", "node"],
    ["a-node", "a-node"], 
    ["b-node", "b-node"], 
    ["c-node", "c-node"], 

    ["test-aaa", "test-aaa"], 
    ["test-bbb", "test-bbb"], 

    ["abcdefhijklmnopqrstuvwxyz", "..jklmnopq.."],
    ["lenny", "lenny"],
    ["carl", "carl"],
]));
testAbbreviation("complex, shuffled", new Map([
    ["a-node", "a-node"], 
    ["hello-1234", "..-1234"],
    ["test-bbb", "test-bbb"], 
    ["c-node", "c-node"], 
    ["b-node", "b-node"], 
    ["hello-9012", "..-9012"],
    ["hello", "hello"],
    ["carl", "carl"],
    ["abcdefhijklmnopqrstuvwxyz", "..jklmnopq.."],
    ["node", "node"],
    ["test-aaa", "test-aaa"], 
    ["hello-3456", "..-3456"],
    ["hello-3456789012", "..56789012"],
    ["hello-5678", "..-5678"],
    ["lenny", "lenny"],
]));
testAbbreviation("algorithmic weakness: affix not found when available", new Map([
    // Note that this algorithm can easily be thrown off if the best
    // affix has its starting characters the same as some others
    ["hello-1", "hello-1"],
    ["hello-2", "hello-2"],
    ["test-aaa", "test-aaa"], // ideally "..aaa"
    ["test-bbb", "test-bbb"], // ideally "..bbb" 
    ["test-ccc", "test-ccc"], // ideally "..ccc" 
    ["harry", "harry"], 
    ["hermione", "hermione"],
    // In this case, the last two entries begin with 'h', making 'h' the
    // dominant prefix. However, the similarities end there, and since
    // a prefix must be at least Abbreviation.MIN_AFFIX_LEN long, so
    // ultimately no affix is chosen.
]));
testAbbreviation("algorithmic weakness: dominant affix not best", new Map([
    // Continuing the example from the previous test....
    ["hello-1", "..lo-1"],    // ideally "hello-1"
    ["hello-2", "..lo-2"],    // ideally "hello-2"
    ["test-aaa", "test-aaa"], // ideally "..aaa"
    ["test-bbb", "test-bbb"], // ideally "..bbb" 
    ["test-ccc", "test-ccc"], // ideally "..ccc" 
    ["helsinki", "..sinki"],  // ideally "helsinki"
    ["help", "..p"],          // ideally "help"
    // In this case, the last two entries begin with 'hel', making 'hel' the
    // dominant prefix, which is long enough to be a prefix. However, the
    // similarities end there, and 'hel' hijacks the legitimate prefix of
    // 'test-'.
]));




/**
 * Global
 */
beginSection("Global.js");

global.setPairwiseView(true);
global.drawAll();

var hostAColor = global.hostPermutation.getHostColors().a;
var hostBColor = global.hostPermutation.getHostColors().b;

var $hosts = $("#hostBar rect");
var $circles = $("svg circle");
var $links = $("svg line");

assert("getViews", function () {
    var views = global.getViews();
    return views.length == 2 && views[0] == viewL && views[1] == viewR;
});

assert("draw: component count", function () {
    var h = $hosts.length == 4;
    var c = $circles.length == 8;
    var l = $links.length == 12;
    return h && c && l;
});

assert("draw: host colors", function () {
    return $hosts[0].getAttribute("fill") == hostAColor
    && $hosts[1].getAttribute("fill") == hostBColor;
});

assert("draw: host ordering", function () {
    var sortedHosts = $hosts.sort(function (a, b) {
        return a.getAttribute("cx") < b.getAttribute("cx");
    });
    var first = sortedHosts[0];
    var second = sortedHosts[1];
    return first.getAttribute("fill") == hostAColor
    && second.getAttribute("fill") == hostBColor;
});

assert("draw: node ordering", function () {
    var a = $circles.filter(function (i, c) {
        return c.getAttribute("fill") == hostAColor
    });
    var b = $circles.filter(function (i, c) {
        return c.getAttribute("fill") == hostBColor
    });

    var la = $(a[0]).offset().top < $(a[1]).offset().top;
    var lb = $(b[0]).offset().top < $(b[1]).offset().top;
    var ab = $(a[0]).offset().top < $(b[0]).offset().top;
    var ba = $(b[1]).offset().top < $(a[1]).offset().top;

    return la && lb && ab && ba;
});

/**
 * ShowDiffTransformation
 */
beginSection("ShowDiffTransformation.js");

global.getController().showDiff();

// viewL and viewR have no different hosts or events right now
assert("draw: no differences", function () {
    var squareHosts = $("#hostBar rect").length == 4;
    var rhombusHosts = $("#hostBar polygon").length == 0;
    var circleEvents = $("#vizContainer circle").length == 8;
    var rhombusEvents = $("#vizContainer polygon").length == 0;
    var lines = $("svg line").length == 12;
    return squareHosts && rhombusHosts && circleEvents
    && rhombusEvents && lines;
});

log = 'a1\na {"a":1}\na2\na {"a":2, "b":2}\nb1\nb {"b":1,"a":1}\nb2\nb {"b":2,"a":1}\nc1\nc {"c":1}\nd1\nd {"d":1}';
drawNewLogAndShowDiff(log);

assert("draw: different hosts", function() {
    var squareHosts = $("#hostBar rect").length == 4;
    var rhombusHosts = $("#hostBar polygon").length == 2;
    var circleEvents = $("#vizContainer circle").length == 10;
    var rhombusEvents = $("#vizContainer polygon").length == 0;
    var lines = $("svg line").length == 14;
    return squareHosts && rhombusHosts && circleEvents
    && rhombusEvents && lines;
});

log = 'a1\na {"a":1}\na2\na {"a":2, "b":2}\nb1\nb {"b":1,"a":1}\nb2\nb {"b":2,"a":1}\nb3\nb {"b":3,"a":1}';
drawNewLogAndShowDiff(log);

assert("draw: some different events", function() {
    var squareHosts = $("#hostBar rect").length == 4;
    var rhombusHosts = $("#hostBar polygon").length == 0;
    var circleEvents = $("#vizContainer circle").length == 8;
    var rhombusEvents = $("#vizContainer polygon").length == 1;
    var lines = $("svg line").length == 13;
    return squareHosts && rhombusHosts && circleEvents
    && rhombusEvents && lines;
});

log = 'a_event1\na {"a":1}\na_event2\na {"a":2, "b":2}\nb_event1\nb {"b":1,"a":1}\nb_event2\nb {"b":2,"a":1}';
drawNewLogAndShowDiff(log);

assert("draw: all different events", function() {
    var squareHosts = $("#hostBar rect").length == 4;
    var rhombusHosts = $("#hostBar polygon").length == 0;
    var circleEvents = $("#vizContainer circle").length == 0;
    var rhombusEvents = $("#vizContainer polygon").length == 8;
    var lines = $("svg line").length == 12;
    return squareHosts && rhombusHosts && circleEvents
    && rhombusEvents && lines;
});

/**
  * This function takes in a new log and draws the corresponding graph in viewR.
  * It then compares it with the graph in viewL using the showDiff transformation
  */
function drawNewLogAndShowDiff (log) {
    /** have to call hideDiff here first because we're using the same viewL for each comparison
     *  so showDiff won't apply to it (because it already has a showDiff transformation) otherwise
     */
    global.getController().hideDiff();

    parser = new LogParser(log, null, new NamedRegExp('(?<event>.*)\\n(?<host>\\S*) (?<clock>{.*})', 'm'));
    var graph = new ModelGraph(parser.getLogEvents(""));
    hostPermutation.addGraph(graph);
    hostPermutation.update();

    viewR = new View(graph, hostPermutation, "viewR");
    views = [viewL, viewR];

    global = new Global($("#vizContainer"), $("#sidebar"), $("#hostBar"), $("#logTable"), views);
    global.setPairwiseView(true);

    global.setHostPermutation(hostPermutation);
    global.getController().showDiff();
}

$("#vizContainer").remove();
$("#hostBar").remove();
$("#sideBar").remove();
$("#logTable").remove();

/**
 * Parser.js
 */

 beginSection("Parser.js");

// Specific test case for the bug in Issue #168
function testParserException() {
    let isPass = true;
    try {
        var testNamedRegExp = new NamedRegExp("^.* Event = \"(?<event>.*)\"(.|\\n)*?Host = (?<host>.*)(.|\\n)*?VectorClock = \"(?<clock>.*)\"(.|\\n)*?value = \\((?<values>.*)\\)$", "m");
        var testParser = new LogParser(logWithEscapeCharacters, null, testNamedRegExp);
        
        // If no exception is thrown, fail
        isPass = false;
    } catch (e) {

        // If it is not the expected exception, fail
        if(e.isUserFriendly()) {
            isPass = false;
        }
        
    }
    assert("RegExp with escape characters throws exception", function() { return isPass; });
}

testParserException();

console.log(Date.now() - start);
console.log("All tests pass:", all_tests_pass);
