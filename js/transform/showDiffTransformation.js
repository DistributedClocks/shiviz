/**
 * Constructs a ShowDiffTransformation that will re-draw all dissimilar
 * hosts (comparison based on hosts' names) and events (comparison based
 * on the event capture group) among multiple executions, as rhombuses.
 * 
 * @classdesc
 * 
 * <p>
 * This transformation generates a transformed model by comparing the
 * hosts of the given model with the hosts of the model in the other
 * execution. Nodes in these models that represent dissimilar hosts
 * are re-drawn with a rhombus shape. A comparison for processes
 * that appear in both graphs is also made and dissimilar events
 * (in terms of content) in these processes are re-drawn with a
 * rhombus shape
 * </p>
 * 
 * Note: uniqueHosts is an empty array that's populated in showDiffTransformation.compare()
 * with host names for hosts that only show up in viewL or viewR. This is used in global.js
 * to draw hidden hosts that are unique as rhombuses.
 * 
 * Similarly, uniqueEvents is an empty array that's populated in showDiffTransformation.
 * compareNodeContent() with the id of visual nodes that should be drawn with an outline 
 * of a rhombus when clicked on. This is used in controller.showDialog()
 *
 * The hiddenHosts array is passed in because this transformation also needs to compare hosts that
 * are hidden and redraw them as rhombuses if they only appear in one of viewL or viewR
 *
 * @constructor
 */
function ShowDiffTransformation(viewBeingComparedTo, uniqueHosts, hiddenHosts, uniqueEvents) {
    /** @private */
    this.viewBeingComparedTo = viewBeingComparedTo;
	
    /** @private */
    this.uniqueHosts = uniqueHosts;
	
    /** @private */
    this.hiddenHosts = hiddenHosts;
	
    /** @private */
    this.uniqueEvents = uniqueEvents;
}

// ShowDiffTransformation extends Transformation
ShowDiffTransformation.prototype = Object.create(Transformation.prototype);
ShowDiffTransformation.prototype.constructor = ShowDiffTransformation;


/**
* Compares the hosts of this model with the hosts of the given view (viewBeingComparedTo).
* Dissimilar hosts are re-drawn with a rhombus shape and hosts that
* appear in both models have their processes compared node by node.
* 
* @param {VisualGraph} model The VisualGraph to transform
*/
ShowDiffTransformation.prototype.compare = function(model) {

    // get the underlying ModelGraph and its hosts
    var graph = model.getGraph();
    var hosts = graph.getHosts();
    // get all hosts, including the ones hidden, for this modelGraph
    var allHosts = hosts.concat(this.hiddenHosts);
    // get the hidden hosts for viewBeingComparedTo
    var viewBeingComparedTo = this.viewBeingComparedTo;
    var otherHiddenHosts = viewBeingComparedTo.getTransformer().getHiddenHosts();
	
	// Check if the two views have any of the same visible (NOT hidden) hosts
    for (var i = 0; i < hosts.length; i++) {
        var currHost = hosts[i];
        var head = graph.getHead(currHost);
        // check if any of the hosts in the other view (viewBeingComparedTo) match this host
        // if not, add this host to the uniqueHosts array
        if (!viewBeingComparedTo.hasHost(currHost)) {
            if (this.uniqueHosts.indexOf(currHost) == -1) { 
                this.uniqueHosts.push(currHost);
            }
            var visualNode = model.getVisualNodeByNode(head);
            // update the host to have a diamond shape
            visualNode.drawHostAsRhombus();
        // if the other view (viewBeingComparedTo) also has this host and it's not hidden,
        // compare these two processes node by node
        } else {
            if (otherHiddenHosts.indexOf(currHost) == -1) {
               this.compareNodes(model, currHost);
            }
        }
    }

    // Check if any hidden hosts should be drawn as rhombuses and
    // add any hidden hosts that are unique to the uniqueHosts array
    for (i = 0; i < otherHiddenHosts.length; i++) {
        var otherHH = otherHiddenHosts[i];
        // Have to check all hosts here, including hidden ones, because
        // if a host common to both views is hidden, it's not unique
        if (allHosts.indexOf(otherHH) == -1) {
            if (this.uniqueHosts.indexOf(otherHH) == -1) { 
                this.uniqueHosts.push(otherHH);
            }
        }		
    }
};

/**
 * Compares events by content (text and date) in processes with the same host
 *
 * @param {VisualGraph} model The VisualGraph to transform
 * @param {String} commonHost A host that's common to both executions
 *
 */
ShowDiffTransformation.prototype.compareNodes = function(model, commonHost) {
	
    // get the starting nodes for the two graphs being compared
    var head = model.getGraph().getHead(commonHost);
    var otherHead = this.viewBeingComparedTo.getModel().getHead(commonHost);
		
    var next = head.getNext();
    var otherNext = otherHead.getNext();
    this.compareNodeContent(model, next, otherNext);
}

/**
  * Compares processes node by node to find events that are dissimilar. Nodes are
  * compared by the text and date fields in their log events. Different nodes are
  * updated to have a diamond shape.
  * 
  * @param {VisualGraph} model The VisualGraph to transform
  * @param {ModelNode} next The first non-start node after the host in this graph
  * @param {ModelNode} otherNext The first non-start node after the host in the graph 
  *                    of the other execution
  */

ShowDiffTransformation.prototype.compareNodeContent = function(model, next, otherNext) {
	
    var copyOfOtherNext = otherNext;	
	
	// Iterate through the nodes in this model and compare each one (by event capture group)
	// with the nodes in the model for viewBeingComparedTo
    while (!next.isTail()) {
        var logEvents = next.getLogEvents();
		
        for (var i = 0; i < logEvents.length; i++) {			
            var text = logEvents[i].getText();
            var match = false;
			
            while (!otherNext.isTail()) {
                var otherLogEvents = otherNext.getLogEvents();
                for (var j = 0; j < otherLogEvents.length; j++) {
                    var otherText = otherLogEvents[j].getText();
                    if (text == otherText) { 
                       match = true; 
                       break; 
                    }
                }
                if (match) { break; }
                else { otherNext = otherNext.getNext(); }
            }
			
            if (!match) {
                var visualNode = model.getVisualNodeByNode(next);
                // keep track of unique events so that they're drawn differently when clicked on
                this.uniqueEvents.push(visualNode.getId());
                // re-drawn the node as a rhombus
                if (!visualNode.isCollapsed()) { 
                    visualNode.drawEventAsRhombus(7,9); 
                } else {
                    // if the node is collapsed, draw a bigger rhombus with the number of collapsed nodes displayed inside
                    visualNode.drawEventAsRhombus(15,17);
                    visualNode.setLabel(visualNode.getNode().getLogEvents().length); 
                }
            }
            // Start over by assigning otherNext back to its original node
            otherNext = copyOfOtherNext;
        }               
        next = next.getNext();
    }
}

/**
 * Performs the transformation on the given VisualGraph. The VisualGraph and its
 * underlying Graph are modified in place
 * 
 * @param {VisualGraph} model The VisualGraph to transform
 */
ShowDiffTransformation.prototype.transform = function(model) {
    this.compare(model);
};