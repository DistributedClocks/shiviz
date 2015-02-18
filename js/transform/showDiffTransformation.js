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
 * are updated to have a diamond shape. A comparison for processes
 * that appear in both graphs is also made and dissimilar events
 * (in terms of content) in these processes are updated to have
 * a diamond shape.
 * </p>
 * 
 * @constructor
 */
function ShowDiffTransformation(view, uniqueHosts, hiddenHosts) {
    /** @private */
    this.view = view;
	
    /** @private */
    this.uniqueHosts = uniqueHosts;
	
    /** @private */
    this.hiddenHosts = hiddenHosts;
	
    /** @private */
    this.commonHosts = [];
}

// ShowDiffTransformation extends Transformation
ShowDiffTransformation.prototype = Object.create(Transformation.prototype);
ShowDiffTransformation.prototype.constructor = ShowDiffTransformation;


/**
* Compares the hosts of this model with the hosts of the given view.
* 
* @param {VisualGraph} model The VisualGraph to transform
*/
ShowDiffTransformation.prototype.compareHosts = function(model) {

    // get the underlying ModelGraph and its hosts
    var graph = model.getGraph();
    var hosts = graph.getHosts();
    // get all hosts, including the ones hidden, for this modelGraph
    var allHosts = hosts.concat(this.hiddenHosts);
    // get the hidden hosts for the view this modelGraph is being compared to
    var view = this.view;
    var otherHiddenHosts = view.getTransformer().getHiddenHosts();
	
    for (var i = 0; i < hosts.length; i++) {
        var currHost = hosts[i];
        var head = graph.getHead(currHost);
        // check if any of the hosts in the other view match this host
        if (!view.hasHost(currHost)) {
             if (head) {
                this.uniqueHosts.push(currHost);
                var visualNode = model.getVisualNodeByNode(head);
                // update the node to have a diamond shape
                visualNode.update();
             }
        } else {
            if (this.commonHosts.indexOf(currHost) == -1) {
                this.commonHosts.push(currHost);
            }
        }			
    }

    // Add any hidden hosts that are unique to the uniqueHosts array
    for (i = 0; i < otherHiddenHosts.length; i++) {
        var hh = otherHiddenHosts[i];
        // Have to check all hosts here, including hidden ones, because
        // if a host common to both views is hidden, it's not unique
        if (allHosts.indexOf(hh) == -1) {
            this.uniqueHosts.push(hh);
        } else {
            if (this.commonHosts.indexOf(hh) == -1) {
                this.commonHosts.push(hh);
            }
        }			
    }
};

/**
 * Compares events by content for processes that appear in both views
 *
 * @param {VisualGraph} model The VisualGraph to transform
 */
ShowDiffTransformation.prototype.compareEventsByContent = function(model) {
	// TODO
}

/**
 * Performs the transformation on the given VisualGraph. The VisualGraph and its
 * underlying Graph are modified in place
 * 
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
ShowDiffTransformation.prototype.transform = function(model) {
    this.compareHosts(model);
    this.compareEventsByContent(model);
};
