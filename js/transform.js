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

    var tedge = []; //*
    
    var parents = [];
    var children = [];
    while (!curr.isTail()) {
        if (curr.hasParents() || curr.getNext().isTail()) {

            for (var i = 0; i < parents.length; i++) {
                for (var j = 0; j < children.length; j++) {
                    if (parents[i].getHost() != children[j].getHost()) {
                        parents[i].addChild(children[j]);
                        
                        tedge.push({from: parents[i], to: children[j]}); //*
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

    for(var i = 0; i < tedge.length; i++) {
        var obj = tedge[i];
        
        visualGraph.getVisualEdgeByNodes(obj.from, obj.to).setDashLength(5);
    }
};

function CollapseSequentialNodesTransformation(limit) {
    this.limit = limit;
}

CollapseSequentialNodesTransformation.prototype.transform = function(graph, visualGraph) {
    
    var hosts = graph.getHosts();
    for(var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        
        var groupCount = 0;
        var curr = graph.getHead(host).getNext();
        while(!curr.isTail()) {
            if(curr.hasChildren() || curr.hasParents()) { //TODO: eddge case at end
                if(groupCount >= this.limit) {
                    
                    var logEvents = [];
                    curr = curr.getPrev();
                    while(groupCount-- > 0) {
                        logEvents = logEvents.concat(curr.getLogEvents().reverse());
                        var prev = curr.getPrev();
                        curr.remove();
                        curr = prev;
                    }
                    var newNode = new Node(logEvents.reverse(), curr.getHost());
                    curr.insertNext(newNode);
                }
                groupCount = 0;
            }
            else {
                groupCount++;
            }
            curr = curr.getNext();
        }
    }
    
    visualGraph.update();
    
    var nodes = graph.getNodes();
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(node.getLogEvents().length > 1) {
            var visualNode = visualGraph.getVisualNodeByNode(node);
            visualNode.setRadius(15);
            visualNode.setLabel(node.getLogEvents().length);
        }
    }
};
