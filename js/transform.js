/**
 * Graph transformations are defined in this file. A graph transformation takes
 * a graph as input and modifies it in place. Each type of transformation is
 * defined in its own class. The transform method is solely responsible for
 * performing the actual transformation.
 * 
 * Graph transformations should strive to preserve the definitions of 'parent',
 * 'child', 'next' and 'previous' as defined in node.js
 * 
 * In general, the constructors of the transformations should not perform any
 * sort of validation. The transform method itself should validate that the
 * transformation is valid and throw an error otherwise.
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

    if (!graph.hasHost(this.hostToHide)) {
        throw "Cannot hide host " + this.hostToHide
                + " because it does not exist";
    }

    var curr = graph.getHead(this.hostToHide).getNext();

    var parents = [];
    var children = [];
    while (!curr.isTail()) {
        if (curr.hasParents() || curr.getNext().isTail()) {

            for (var i = 0; i < parents.length; i++) {
                for (var j = 0; j < children.length; j++) {
                    if (parents[i].getHost() != children[j].getHost()) {
                        parents[i].addChild(children[j]);
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

};

/**
 * Transformation to hide a node from the model. All parents and children of the
 * node will be removed. The previous node and the next node will be linked
 * 
 * @constructor
 * @param {Array.<Node>} nodesToHide The nodes to hide from the model
 */
function HideNodeTransformation(nodesToHide) {
    this.nodesToHide = nodesToHide;
}

/**
 * @param {Graph} graph The graph to transform. Modified in place
 */
HideNodeTransformation.prototype.transform = function(graph) {

    for (var i = 0; i < nodesToHide.length; i++) {
        var node = nodesToHide[i];
        if(node.isHead() || node.isTail()) {
            throw "Cannot hide a head or tail node";
        }
        nodesToHide[i].remove();
    }

};

/**
 * Transformation to collapse multiple nodes into one
 * 
 * @constructor
 */
function CollapseNodesTransformation() {

    this.toCollapse = [];
}

CollapseNodesTransformation.prototype.addNodesToCollapse = function(startNode,
        numberToCollapse) {
    var params = {
        startNode : startNode,
        numberToCollapse : numberToCollapse
    };
    this.toCollapse.push(params);
};

/**
 * @param {Graph} graph The graph to transform. Modified in place
 */
CollapseNodesTransformation.prototype.transform = function(graph) {

    for(var i = 0; i < this.toCollapse.length; i++) {
        var param = this.toCollapse[i];
        
        var node = param.startNode;
        
        if(node.isHead() || node.isTail()) {
            throw "Cannot collapse a head or tail node";
        }
        
        var head = node.getPrev();
        
        var logEvents = node.getLogEvents();
        for(var j = 0; j < param.numberToCollapse; j++) {
            var next = node.getNext();
            node.remove();
            node = next;
            
            if(node.isTail()) {
                throw "Cannot collapse a head or tail node";
            }
            
            logEvents.concat(node.getLogEvents());
            
        }
        
        var newNode = new Node(logEvents, head.getHost());
        head.insertNext(newNode);
    }

};
