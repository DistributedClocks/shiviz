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
  
  var curr = graph.getHead(this.hostToHide).getNext();

  var parents = null;
  while(!curr.isTail()) {
    if(curr.hasParents()) {
      parents = curr.getParents();
    }
    
    if(curr.hasChildren() && parents != null) {
      var children = curr.getChildren();

      for(var i = 0; i < parents.length; i++) {
        for(var j = 0; j < children.length; j++) {
          if(parents[i].getHost() != children[j].getHost()) {
            parents[i].addChild(children[j]);
          }
        }
      }

      parents = null;
    }
    
    curr = curr.getNext();
  }
  
  graph.removeHost(this.hostToHide);

  
};




