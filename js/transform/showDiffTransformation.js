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
}

// ShowDiffTransformation extends Transformation
ShowDiffTransformation.prototype = Object.create(Transformation.prototype);
ShowDiffTransformation.prototype.constructor = ShowDiffTransformation;


/**
* Compares the hosts of this model with the hosts of the given view.
* Dissimilar hosts are updated to have a diamond shape and hosts that
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
    // get the hidden hosts for the view this modelGraph is being compared to
    var view = this.view;
    var otherHiddenHosts = view.getTransformer().getHiddenHosts();
	
    for (var i = 0; i < hosts.length; i++) {
        var currHost = hosts[i];
        var head = graph.getHead(currHost);
        // check if any of the hosts in the other view match this host
        // if not, add this host to the uniqueHosts array
        if (!view.hasHost(currHost)) {
             if (head) {
                if (this.uniqueHosts.indexOf(currHost) == -1) { 
                   this.uniqueHosts.push(currHost);
                }
                var visualNode = model.getVisualNodeByNode(head);
                // update the host to have a diamond shape
                visualNode.updateHostShape();
             }
        // if the other view also has this host and it's not hidden,
        // compare these two processes node by node
        } else {
            if (otherHiddenHosts.indexOf(currHost) == -1) {
               this.compareNodes(model, currHost);
            }
        }
    }

    // Add any hidden hosts that are unique to the uniqueHosts array
    for (i = 0; i < otherHiddenHosts.length; i++) {
        var hh = otherHiddenHosts[i];
        // Have to check all hosts here, including hidden ones, because
        // if a host common to both views is hidden, it's not unique
        if (allHosts.indexOf(hh) == -1) {
            if (this.uniqueHosts.indexOf(hh) == -1) { 
                this.uniqueHosts.push(hh);
            }
        }		
    }
};

/**
 * Compares events by content (text and date) in processes with the same host
 *
 * @param {VisualGraph} model The VisualGraph to transform
 * @param {String} host A host that's common to both executions
 *
 */
ShowDiffTransformation.prototype.compareNodes = function(model, host) {
	
    // get the starting nodes for the two graphs being compared
    var head = model.getGraph().getHead(host);
    var otherHead = this.view.getModel().getHead(host);
		
    var next = head.getNext();
    var otherNext = otherHead.getNext();
    this.compareNodeContent(model, next, otherNext);
		
    next = head.getNext();
    otherNext = otherHead.getNext();
    this.compareNodeContent(this.view.getVisualModel(), otherNext, next);
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
	
    var otherNextCopy = otherNext;	
    while (!next.isTail()) {
        var logEvents = next.getLogEvents();
		
        for (var i = 0; i < logEvents.length; i++) {			
            var text = logEvents[i].getText();
            var date = logEvents[i].getFields()["date"];
            var match = false;
			
            while (!otherNext.isTail()) {
                var otherLogEvents = otherNext.getLogEvents();
                for (var j = 0; j < otherLogEvents.length; j++) {
                    var otherText = otherLogEvents[j].getText();
                    var otherDate = otherLogEvents[j].getFields()["date"];
                    if (text == otherText && date == otherDate) { 
                       match = true; 
                       break; 
                    }
                }
                if (match) { break; }
                else { otherNext = otherNext.getNext(); }
            }
			
            if (!match) {
                var visualNode = model.getVisualNodeByNode(next);
                // update the node to have a diamond shape
                visualNode.updateNodeShape();
            }
            otherNext = otherNextCopy;
        }               
        next = next.getNext();
    }
}

/**
 * Performs the transformation on the given VisualGraph. The VisualGraph and its
 * underlying Graph are modified in place
 * 
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
ShowDiffTransformation.prototype.transform = function(model) {
    this.compare(model);
};
