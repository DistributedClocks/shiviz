/**
 * Graph transformations are defined in this file. A graph transformation takes
 * a graph as input and modifies it in place. Each type of transformation is
 * defined in its own class. The transform method is solely responsible for
 * performing the actual transformation.
 * 
 * Graph transformations should strive to preserve the definitions of 'parent',
 * 'child', 'next' and 'previous' as defined in node.js
 * 
 * Each transformation should declare a priority field of type Number. Transformations of highest priority will be applied first.
 */

/**
 * This transformation generates a transformed model by removing this Transformation's hostToHide
 * from the provided model. It removes all nodes for the hostToHide and any edges
 * touching a node for the hostToHide and adds transitive edges. The added transitive edges will be drawn with dashed lines.
 * 
 * @constructor
 * @param {String} hostToHide The host to hide from the model
 */
function HideHostTransformation(hostToHide) {
    
    this.priority = 80;
    
    /** @private */
    this.hostToHide = hostToHide;
}

/**
 * Performs the transformation on the given visualGraph. The VisualGraph and its underlying Graph are modified in place
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
HideHostTransformation.prototype.transform = function(visualGraph) {

    var graph = visualGraph.getGraph();
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

/**
 * @class
 * CollapseSequentialNodeTransformation groups local consecutive events that have no remote dependencies. The collapsed nodes
 * will have an increased radius and will contain a label indicating the number of nodes collapsed into it. This transformation
 * provides methods for adding and removing nodes exempt from this collapsing process.
 * 
 * This transformation collapses nodes that belong to the same group. Intuitively, nodes belong to the same
 * group if they are local consecutive events that have no remote dependencies. More formally, a node y is in x's group
 * if y == x or y has no family and y's prev or next node is in x's group.
 * 
 * @param {Number} threshold Nodes are collapsed if the number of nodes in the group is greater than or equal to the threshold. The threshold must be greater than or equal to 2.
 * @returns
 */
function CollapseSequentialNodesTransformation(threshold) {
    
    /** @private */
    this.threshold = 2;
    this.setThreshold(threshold);
    
    /** @private */
    this.exemptLogEvents = {};
    
    this.priority = 20;
}

/**
 * Gets the threshold. Nodes are collapsed if the number of nodes in the group is greater than or equal to the threshold. The threshold must be greater than or equal to 2.
 * 
 * @returns {Number} The threshold
 */
CollapseSequentialNodesTransformation.prototype.getThreshold = function() {
    return this.threshold;
};

/**
 * Sets the threshold. Nodes are collapsed if the number of nodes in the group is greater than or equal to the threshold. The threshold is always greater than or equal to 2.
 * 
 * @param {Number} threshold The new threshold
 */
CollapseSequentialNodesTransformation.prototype.setThreshold = function(threshold) {
    if(threshold < 2) {
        throw "Invalid threshold. Threshold must be greater than or equal to 2";
    }
    
    this.threshold = threshold;
};

/**
 * Adds an exemption. An exemption is a LogEvent whose Node will never be collapsed. 
 * 
 * Note that addExemption and removeExemption are not inverses of each other. addExemption affects only the 
 * LogEvents of the given node, while removeExemption affects the LogEvents of the given node and all nodes in its group.
 * 
 * @param {Node} node The node whose LogEvents will be added as exemptions
 */
CollapseSequentialNodesTransformation.prototype.addExemption = function(node) {
    var logEvents = node.getLogEvents();
    for(var i = 0; i < logEvents.length; i++) {
        this.exemptLogEvents[logEvents[i].getId()] = true;
    }
};


/**
 * Removes an exemption. An exemption is a LogEvent whose Node will never be collapsed
 * 
 * Note that addExemption and removeExemption are not inverses of each other. addExemption affects only the 
 * LogEvents of the given node, while removeExemption affects the LogEvents of the given node and all nodes in its group.
 * 
 * @param {Node} node The LogEvents of this node and the LogEvents of every node in its group will be removed as exemptions
 */
CollapseSequentialNodesTransformation.prototype.removeExemption = function(node) {
    if(node.hasChildren() || node.hasParents()) {
        var logEvents = node.getLogEvents();
        for(var i = 0; i < logEvents.length; i++) {
            delete this.exemptLogEvents[logEvents[i].getId()];
        }
        return;
    }
    
    var head = node;
    while(!head.isHead() && !head.hasChildren() && !head.hasParents()) {
        head = head.getPrev();
    }
    
    var tail = node;
    while(!tail.isTail() && !tail.hasChildren() && !tail.hasParents()) {
        tail = tail.getNext();
    }
    
    var curr = head.getNext();
    while(curr != tail) {
        var logEvents = curr.getLogEvents();
        for(var i = 0; i < logEvents.length; i++) {
            delete this.exemptLogEvents[logEvents[i].getId()];
        }
        curr = curr.getNext();
    }
};

CollapseSequentialNodesTransformation.prototype.toggleExemption = function(node) {
    if(this.isExempt(node)) {
        this.removeExemption(node);
    }
    else {
        this.addExemption(node);
    }
};

/**
 * Determines if any of the LogEvents contained inside the given node is an exemption
 * 
 * @param {Node} node The node to check
 * @returns {Boolean} True if one of the LogEvents is an exemption
 */
CollapseSequentialNodesTransformation.prototype.isExempt = function(node) {
    var logEvents = node.getLogEvents();
    for(var i = 0; i < logEvents.length; i++) {
        if(this.exemptLogEvents[logEvents[i].getId()]) {
            return true;
        }
    }
    return false;
};

/**
 * Performs the transformation on the given visualGraph. The VisualGraph and its underlying Graph are modified in place
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
CollapseSequentialNodesTransformation.prototype.transform = function(visualGraph) {

    var graph = visualGraph.getGraph();
    
    function collapse(curr, removalCount) {
        var logEvents = [];
        var prev = curr.getPrev();
        while(removalCount-- > 0) {
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
    
    
    var hosts = graph.getHosts();
    for(var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        
        var groupCount = 0;
        var prev = graph.getHead(host);
        var curr = prev.getNext();
        while(curr != null) {
            
            if(curr.hasChildren() || curr.hasParents() || curr.isTail() || this.isExempt(curr)) {
                if(groupCount >= this.threshold) {
                    collapse(prev, groupCount);
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
