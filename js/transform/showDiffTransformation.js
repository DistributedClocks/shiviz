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
 * are re-drawn as rhombuses. 
 * A comparison for processes that appear in both graphs is also made 
 * and dissimilar events in these processes are re-drawn as rhombuses
 * </p>
 * 
 * @constructor
 */
function ShowDiffTransformation(view, uniqueHosts, hiddenHosts, uniqueEvents) {
    /** @private */
    this.view = view;
    
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
* Compares the hosts of this model with the hosts of the given view.
* Dissimilar hosts are updated to have a diamond shape and hosts that
* appear in both models have their processes compared node by node.
* 
* @param {VisualGraph} model The VisualGraph to transform
*/
ShowDiffTransformation.prototype.compare = function(model) {

    // get the underlying ModelGraph and its non-hidden hosts
    var graph = model.getGraph();
    var hosts = graph.getHosts();
    // get all of the hosts (including hidden ones) for the view this modelGraph is being compared to
    var view = this.view;
    var otherHiddenHosts = view.getTransformer().getHiddenHosts();
    var allOtherHosts = view.getModel().getHosts().concat(otherHiddenHosts);
    
    // This for loop only checks non-hidden hosts
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
        // compare these two processes node by node - have to check
        // hidden hosts here because when you unhide a host, it might
        // not be added to the list of visible hosts yet
        } else {
            if (otherHiddenHosts.indexOf(currHost) == -1) {
               this.compareNodes(model, currHost);
            }
        }
    }

    // Add any hidden hosts that are unique to the uniqueHosts array
    for (i = 0; i < this.hiddenHosts.length; i++) {
        var hh = this.hiddenHosts[i];
        // Have to check all hosts here because sometimes when a host
        // is hidden, it isn't added to the list of hidden hosts before
        // a comparison is made so it'll be seen as unique when it's not
        if (allOtherHosts.indexOf(hh) == -1) {
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
                // update the node to have a diamond shape
                if (!visualNode.isCollapsed()) { 
                    visualNode.updateNodeShape(7,9); 
                } else {
                    // if the node is collapsed, draw a bigger diamond with the number of collapsed nodes displayed inside
                    visualNode.updateNodeShape(15,17);
                    visualNode.setLabel(visualNode.getNode().getLogEvents().length); 
                }
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