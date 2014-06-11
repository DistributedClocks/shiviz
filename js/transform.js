/**
 * Graph transformations are defined in this file. A graph transformation takes
 * a graph as input and modifies it in place. Each type of transformation is
 * defined in its own class. The transform method is solely responsible for
 * performing the actual transformation.
 * 
 * Graph transformations should strive to preserve the definitions of 'parent',
 * 'child', 'next' and 'previous' as defined in node.js
 */

/**
 * Transformation to hide a host from the model. Adds transitive edges to the
 * model.
 * 
 * @constructor
 * @param {String} hostToHide The host to hide from the model
 */
function HideHostTransformation(hostToHide) {
    this.priority = 80;
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
HideHostTransformation.prototype.transform = function(graph, visualGraph) {

    var curr = graph.getHead(this.hostToHide).getNext();
    
    var parents = [];
    var children = [];
    while (!curr.isTail()) {
        if (curr.hasParents() || curr.getNext().isTail()) {

            for (var i = 0; i < parents.length; i++) {
                for (var j = 0; j < children.length; j++) {
                    if (parents[i].getHost() != children[j].getHost()) {
                        parents[i].addChild(children[j]);
                        
                        visualGraph.getVisualEdgeByNodes(parents[i], children[j]).setDashLength(5);
                    }
                }
            }

            if (children.length > 0) {
                children = [];
                parents = [];
            }
            parents = parents.concat(curr.getParents());
        }

        if (curr.hasChildren()) {
            children = children.concat(curr.getChildren());
        }

        curr = curr.getNext();
    }

    graph.removeHost(this.hostToHide);
    
    visualGraph.update();

};

function CollapseSequentialNodesTransformation(threshold, exemptLogEvents) {
    this.threshold = threshold;
    this.exemptLogEvents = exemptLogEvents;
}

CollapseSequentialNodesTransformation.prototype.setThreshold = function(threshold) {
    this.threshold = threshold;
};

CollapseSequentialNodesTransformation.prototype.getThreshold = function() {
    return this.threshold;
};

CollapseSequentialNodesTransformation.prototype.addExemptLogEvent = function(logEvent) {
    this.exemptLogEvents.push(logEvent);
};

CollapseSequentialNodesTransformation.prototype.addAllExemptLogEvent = function(logEvents) {
    for(var i = 0; i < logEvents.length; i++) {
        this.addExemptLogEvent(logEvents[i]);
    }
};

CollapseSequentialNodesTransformation.prototype.transform = function(graph, visualGraph) {
    
    this.priority = 20;
    
    var hosts = graph.getHosts();
    for(var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        
        var groupCount = 0;
        var prev = graph.getHead(host);
        var curr = prev.getNext();
        while(curr != null) {
            
            var hasExemptLogEvent = false;
            var logEvents = curr.getLogEvents();
            for(var j = 0; j < logEvents.length; j++) {
                if(this.exemptLogEvents.indexOf(logEvents[j]) >= 0) {
                    hasExemptLogEvent = true;
                    break;
                }
            }
            
            if(curr.hasChildren() || curr.hasParents() || curr.isTail() || hasExemptLogEvent) {
                if(groupCount >= this.threshold) {
                    
                    var logEvents = [];
                    curr = prev;
                    prev = curr.getPrev();
                    while(groupCount-- > 0) {
                        logEvents = logEvents.concat(curr.getLogEvents().reverse());
                        prev = curr.getPrev();
                        curr.remove();
                        curr = prev;
                    }
                    var newNode = new Node(logEvents.reverse());
                    curr.insertNext(newNode);
                    
                    var visualNode = visualGraph.getVisualNodeByNode(newNode);
                    visualNode.setRadius(15);
                    visualNode.setLabel(newNode.getLogEvents().length);
                }
                groupCount = 0;
            }
            else {
                groupCount++;
            }
            prev = curr;
            curr = curr.getNext();
        }

    }

    visualGraph.update();

};
