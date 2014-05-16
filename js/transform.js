/**
 * Transformation to add transitive edges for a target host to skip.
 * Does not remove that host from the model.
 */
function TransitiveEdgesTransformation(hostToHide) {
  this.hostToHide = hostToHide;
}

/**
 * Generates a transformed model by cloning the provided prior model and adding
 * transitive edges for this Transformation's hostToHide.
 *
 * The algorithm iterates over every event in the hostToHide and adds an edge
 * from every parent of the current node to every child. The addEdge method
 * handles the logic to ensure that every event has at most one parent from
 * every host, taking the latest possible parent, and every event has at most
 * one child at every host, taking the earliest possible child.
 */
TransitiveEdgesTransformation.prototype.transform = function(model) {
  this.priorModel = model;
  this.finalModel = this.priorModel.clone();
  var curNode = this.finalModel.getNode(this.hostToHide, 0);
  while (curNode != null) {
    var parents = this.finalModel.edges[curNode.id()]['parents'];
    for (var parentHost in parents) {
      var parentNode = this.finalModel.getNode(parentHost, parents[parentHost]);
      var children = this.finalModel.edges[curNode.id()]['children'];
      for (var childHost in children) {
        var childNode = this.finalModel.getNode(childHost, children[childHost]);
        this.finalModel.addEdge(parentNode, childNode);
      }
    }
    curNode = this.finalModel.getNextNode(this.hostToHide, curNode.time + 1);
  }
  return this.finalModel;
}

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
HideHostTransformation.prototype.transform = function(model) {
  this.priorModel = model;
  this.finalModel = this.priorModel.clone();
  delete this.finalModel.hosts[this.hostToHide];
  this.removeHostEdges(this.finalModel, this.hostToHide);
  return this.finalModel;
}

/**
 * Static helper method to remove all edges from the provided model touching a node on
 * the provided hostToHide.
 */
HideHostTransformation.prototype.removeHostEdges = function(model, hostToHide) {
  for (var edge in model.edges) {
    if (edge.split(":")[0] == hostToHide) {
      delete model.edges[edge];
      continue;
    }

    delete model.edges[edge]['children'][hostToHide];
    delete model.edges[edge]['parents'][hostToHide];
  }
}

/**
 * Transformation to hide a set of nodes form the visualization
 * @param nodesToHide an array of nodes that are to be hidden.
 */
function HideNodesTransformation(nodesToHide) {
  this.nodesToHide = nodesToHide;
}

HideNodesTransformation.prototype.transform = function(model) {
  this.priorModel = model;
  this.finalModel = this.priorModel.clone();
  for(var i = 0; i < this.nodesToHide.length; i++) {
    this.finalModel.removeNode(this.nodesToHide[i]);
  }
  return this.finalModel;
};
