function assert (outcome, description) {
  var li = document.createElement('li');
  li.className = outcome ? 'pass' : 'fail';
  li.appendChild(document.createTextNode(description));
  document.getElementById('output').appendChild(li);
};

var graph = new Graph();
var clock = {};
clock['A'] = 1;
var a1 = new Node("Blah", "A", JSON.parse(JSON.stringify(clock)));
clock['A'] = 2;
var a2 = new Node("Blah", "A", JSON.parse(JSON.stringify(clock)));
clock['A'] = 4;
clock['B'] = 1;
var a4 = new Node("Blah", "A", JSON.parse(JSON.stringify(clock)));
clock['A'] = 7;
var a7 = new Node("Blah", "A", JSON.parse(JSON.stringify(clock)));
clock['A'] = 8;
var a8 = new Node("Blah", "A", JSON.parse(JSON.stringify(clock)));
delete clock['A'];
clock['B'] = 1;
var b1 = new Node("Blah", "B", JSON.parse(JSON.stringify(clock)));
clock['B'] = 4;
clock['A'] = 7;
var b4 = new Node("Blah", "B", JSON.parse(JSON.stringify(clock)));

graph.addNode(a7);
graph.addNode(a4);
graph.addNode(a2);
graph.addNode(a8);
graph.addNode(a1);
graph.addNode(b4);
graph.addNode(b1);

assert(graph.getHosts().length == 2, "Checking getHosts - size");
assert(graph.getHosts().indexOf("A") > -1, "Checking getHosts - contents");
assert(graph.getHosts().indexOf("B"), "Checking getHosts - contents");

assert(graph.getNode("A", 1) === a1, "Checking getNode");
assert(graph.getNode("A", 3) == null, "Checking getNode - not present");
assert(graph.getNextNode("A", 2) == a2, "Checking getNextNode - no skip");
assert(graph.getNextNode("A", 3) == a4, "Checking getNextNode - 1 skip");
assert(graph.getNextNode("A", 5) == a7, "Checking getNextNode - bigger skip");