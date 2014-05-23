/**
 * Transformation to hide a host from the model. Assumes transitive edges have
 * already been added to the model if desired.
 */
function HideHostTransformation(hostToHide) {
  this.hostToHide = hostToHide;
}

/**
 * Generates a transformed model by removing this Transformation's hostToHide
 * from the provided model. Removes all nodes for the hostToHide and any edges
 * touching a node for the hostToHide.
 */
HideHostTransformation.prototype.transform = function(graph) {
  
  var curr = graph.getHead(this.hostToHide);
  
  var candidate = null;
  while(!curr.isTail()) {
    for (var i = 0; i < curr.parents.length; i++) {
      for (var j = 0; j < curr.children.length; j++) {
        var parent = curr.parents[i];
        var child = curr.children[j];
        if (child.host != parent.host) {
          parent.addChild(child);
          child.addParent(parent);
        }
      }
    }
    curr = curr.getNext();
  }

  graph.removeHost(this.hostToHide);
  
};
