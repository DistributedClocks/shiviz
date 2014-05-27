/**
 * Graph transformations are defined in this file. A graph transformation takes
 * a graph as input and modifies it in place. Each type of transformation is
 * defined in its own class. The transform method is solely responsible for
 * performing the actual transformation.
 */

/**
 * Transformation to hide a host from the model. Adds transitive edges to the
 * model.
 * 
 * @constructor
 * @param {String} hostToHide The host to hide from the model
 */
function HideHostTransformation(hostToHide) {
  this.hostToHide = hostToHide;
}

/**
 * Generates a transformed model by removing this Transformation's hostToHide
 * from the provided model. Removes all nodes for the hostToHide and any edges
 * touching a node for the hostToHide and adds transitive edges. This method
 * modifies the provided graph in place
 * 
 * @param {Graph} graph The graph to transform. Modified in place
 */
HideHostTransformation.prototype.transform = function(graph) {

  var curr = graph.getHead(this.hostToHide).getNext();

  var parents = null;
  while (!curr.isTail()) {
    if (curr.hasParents()) {
      parents = curr.getParents();
    }

    if (curr.hasChildren() && parents != null) {
      var children = curr.getChildren();

      for ( var i = 0; i < parents.length; i++) {
        for ( var j = 0; j < children.length; j++) {
          if (parents[i].getHost() != children[j].getHost()) {
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
