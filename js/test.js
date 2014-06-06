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
    err.appendChild(document.createTextNode(e.stack.replace(/(^|\n)/g, '$1      ')));

    li.appendChild(err);
    document.getElementById('output').appendChild(li);

    return;
  }

  var li = document.createElement('li');
  li.className = result ? 'pass' : 'fail';
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

/**
 * model.js
 */

assert("Checking getHosts - size", function () {
  return graph.getHosts().length == 2; 
});
assert("Checking getHosts - contents", function () {
  return graph.getHosts().indexOf("A") > -1;
});
assert("Checking getHosts - contents", function () {
  return graph.getHosts().indexOf("B");
});

assert("Checking getNode", function () {
  return graph.getNode("A", 1) === a1;
});
assert("Checking getNode - not present", function () {
  return graph.getNode("A", 3) == null;
});
assert("Checking getNextNode - no skip", function () {
  return graph.getNextNode("A", 2) == a2;
});
assert("Checking getNextNode - 1 skip", function () {
  return graph.getNextNode("A", 3) == a4;
});
assert("Checking getNextNode - bigger skip", function () {
  return graph.getNextNode("A", 5) == a7;
});