/**
 * Transformation to hide a host from the model.
 * Adds transitive edges to the model.
 */
function HideHostTransformation(hostToHide) {
  this.hostToHide = hostToHide;
}

/**
 * Generates a transformed model by removing this Transformation's hostToHide
 * from the provided model. Removes all nodes for the hostToHide and any edges
 * touching a node for the hostToHide and adds transitive edges.
 */
HideHostTransformation.prototype.transform = function(graph) {
  
  var curr = graph.getHead(this.hostToHide);
  
  var candidate = null;
  while(!curr.isTail()) {
    for (var i = 0; i < curr.parents.length; i++) {
      var parent = curr.parents[i];
      for (var j = 0; j < curr.children.length; j++) {
        var child = curr.children[j];
        if (child.host != parent.host) {
          parent.addChild(child);
        }
      }

      if (!curr.getNext().isTail()) {
        curr.getNext().addParent(parent);
      }
    }
    curr = curr.getNext();
  }

  graph.removeHost(this.hostToHide);
  
};
