/**
 * Edge class
 */
function Edge(src, dest) {
  this.src = src;
  this.dest = dest;
}

Edge.prototype.getSrc = function() {
  return this.src;
}

Edge.prototype.getDest = function() {
  return this.dest;
}

function Edges() {}

Edges.prototype.toLiteral = function(hiddenHosts, nodes) {
  for (var i = 0; i < hiddenHosts.length; i++) {
    var hiddenHost = hiddenHosts[i];
    var curNode = nodes.get(hiddenHost, 0);

    while (curNode != null) {
      var parents = curNode.getSynParents();
      var children = curNode.getSynChildren();

      for (var parentHost in parents) {
        var parentNode = parents[parentHost];
        for (var childHost in children) {
          var childNode = children[childHost];
          parentNode.addSynChild(childNode);
          childNode.addSynParent(parentNode);
        }
      }
      curNode = nodes.getNext(hiddenHost, curNode.getTime() + 1);
    }
  }

  var literal = [];
  var hosts = nodes.getHosts();
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    if (hiddenHosts.indexOf(host) > -1) {
      continue;
    }

    var curNode = nodes.get(host, 0);
    while (curNode != null) {
/*      if (curNode.isCollapsed()) {
        curNode = nodes.getNext(host, curNode.getTime() + 1);
        continue;
      }*/
      var children = curNode.getSynChildren();
      for (var otherHost in children) {
        if (hiddenHosts.indexOf(otherHost) > -1) {
          continue;
        }

        var child = nodes.get(otherHost, children[otherHost].getTime());
/*        if (child.isCollapsed()) {
          child = curNode.getCollapsedTarget();
        } */

        if (child != null) {
          var edge = {};
          edge["source"] = curNode.getIndex();
          edge["target"] = child.getIndex();
          literal.push(edge);
        }
      }
      curNode = nodes.getNext(host, curNode.getTime() + 1);
    }
  }
  return literal;
}


