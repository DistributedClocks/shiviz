/**
 * Constructs a ShowDiffTransformation that will re-draw all dissimilar
 * hosts (comparison based on hosts' names) among multiple executions
 * as diamonds.
 * 
 * @classdesc
 * 
 * <p>
 * This transformation generates a transformed model by comparing the
 * hosts of the given model with the hosts of the model in the other
 * execution. Nodes in these models that represent dissimilar hosts
 * have their isUniqueStart property set to true.
 * </p>
 * 
 * @constructor
 */
function ShowDiffTransformation(view) {
    /** @private */
    this.view = view;
}

// ShowDiffTransformation extends Transformation
ShowDiffTransformation.prototype = Object.create(Transformation.prototype);
ShowDiffTransformation.prototype.constructor = ShowDiffTransformation;


/**
* Compares the hosts of the view this model belongs to with the 
* given view.
* 
* @param {VisualGraph, View} model The VisualGraph to transform
*                            view  The view to compare to
*/
ShowDiffTransformation.prototype.compare = function(model, view) {
    // get the underlying ModelGraph
    var graph = model.getGraph();
    var hosts = graph.getHosts();
	
    for (var i = 0; i < hosts.length; i++) {
        // If none of the hosts in the other view match this host, mark it as unique
        if (!view.hasHost(hosts[i])) {
          var head = graph.getHead(hosts[i]);
          if (head) head.setUnique(true);
		  var visualNode = model.getVisualNodeByNode(head);
		  visualNode.update();
        }
    }
};

/**
 * Performs the transformation on the given VisualGraph. The VisualGraph and its
 * underlying Graph are modified in place
 * 
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
ShowDiffTransformation.prototype.transform = function(model) {
	this.compare(model, this.view); 
};
