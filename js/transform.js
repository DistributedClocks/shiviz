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
    if(curr.hasBeforeNode()) {
      candidate = curr.getBeforeNode();
    }
    if(curr.hasAfterNode() && candidate != null) {
      candidate.setAfterNode(curr.getAfterNode);
      curr.getAfterNode().setBeforeNode(candidate);
      candidate = null;
    }
    curr = curr.getNext();
  }

  graph.removeHost(this.hostToHide);
  
};
