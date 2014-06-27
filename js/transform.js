/**
 * Graph transformations are defined in this file. A graph transformation takes
 * a graph as input and modifies it in place. Each type of transformation is
 * defined in its own class. The transform method is solely responsible for
 * performing the actual transformation.
 * 
 * Graph transformations should strive to preserve the definitions of 'parent',
 * 'child', 'next' and 'previous' as defined in node.js
 * 
 * Each transformation should declare a priority field of type Number.
 * Transformations of highest priority will be applied first.
 */

/**
 * This transformation generates a transformed model by removing this
 * Transformation's hostToHide from the provided model. It removes all nodes for
 * the hostToHide and any edges touching a node for the hostToHide and adds
 * transitive edges. The added transitive edges will be drawn with dashed lines.
 * 
 * If this transformation is applied to a graph that doesn't have the specified
 * host, then this transformation does nothing
 * 
 * @constructor
 * @param {String} hostToHide The host to hide from the model
 */
function HideHostTransformation() {

    this.priority = 80;

    /** @private */
    this.hostsToHide = {};
}

/**
 * Adds a host. The added host will be hidden by the transformation
 * 
 * @param {String} host The host
 */
HideHostTransformation.prototype.addHost = function(host) {
    this.hostsToHide[host] = true;
};

/**
 * Removes a host. The removed host will no longer be hidden by the
 * transformation. If the host does not exist or was never specified to be
 * hidden, this method does nothing
 * 
 * @param {String} host The host
 */
HideHostTransformation.prototype.removeHost = function(host) {
    delete this.hostsToHide[host];
};

/**
 * Removes all hosts. After invoking this method, no hosts will be hidden by
 * this transformation.
 */
HideHostTransformation.prototype.clearHosts = function() {
    this.hostsToHide = {};
};

/**
 * Gets all the hosts that are to be hidden by this transformation as an Array.
 * 
 * @returns {Array<String>}
 */
HideHostTransformation.prototype.getHostsToHide = function() {
    var hosts = [];
    for (var host in this.hostsToHide) {
        hosts.push(host);
    }
    ;
    return hosts;
};

/**
 * Performs the transformation on the given visualGraph. The VisualGraph and its
 * underlying Graph are modified in place
 * 
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
HideHostTransformation.prototype.transform = function(visualGraph) {

    var graph = visualGraph.getGraph();

    for (var host in this.hostsToHide) {

        var curr = graph.getHead(host).getNext();

        var parents = [];
        var children = [];
        while (!curr.isTail()) {
            visualGraph.addHiddenEdgeToFamily(curr);

            if (curr.hasParents() || curr.getNext().isTail()) {

                for (var i = 0; i < parents.length; i++) {
                    for (var j = 0; j < children.length; j++) {
                        if (parents[i].getHost() != children[j].getHost()) {
                            parents[i].addChild(children[j]);

                            visualGraph.getVisualEdgeByNodes(parents[i],
                                    children[j]).setDashLength(5);
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

        graph.removeHost(host);
    }

    visualGraph.update();

};

/**
 * @class
 * 
 * CollapseSequentialNodeTransformation groups local consecutive events that
 * have no remote dependencies. The collapsed nodes will have an increased
 * radius and will contain a label indicating the number of nodes collapsed into
 * it. This transformation provides methods for adding and removing nodes exempt
 * from this collapsing process.
 * 
 * This transformation collapses nodes that belong to the same group.
 * Intuitively, nodes belong to the same group if they are local consecutive
 * events that have no remote dependencies. More formally, a node y is in x's
 * group if y == x or y has no family and y's prev or next node is in x's group.
 * 
 * @param {Number} threshold Nodes are collapsed if the number of nodes in the
 *            group is greater than or equal to the threshold. The threshold
 *            must be greater than or equal to 2.
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
 * Gets the threshold. Nodes are collapsed if the number of nodes in the group
 * is greater than or equal to the threshold. The threshold must be greater than
 * or equal to 2.
 * 
 * @returns {Number} The threshold
 */
CollapseSequentialNodesTransformation.prototype.getThreshold = function() {
    return this.threshold;
};

/**
 * Sets the threshold. Nodes are collapsed if the number of nodes in the group
 * is greater than or equal to the threshold. The threshold is always greater
 * than or equal to 2.
 * 
 * @param {Number} threshold The new threshold
 */
CollapseSequentialNodesTransformation.prototype.setThreshold = function(
        threshold) {
    if (threshold < 2) {
        throw "Invalid threshold. Threshold must be greater than or equal to 2";
    }

    this.threshold = threshold;
};

/**
 * Adds an exemption. An exemption is a LogEvent whose Node will never be
 * collapsed.
 * 
 * Note that addExemption and removeExemption are not inverses of each other.
 * addExemption affects only the LogEvents of the given node, while
 * removeExemption affects the LogEvents of the given node and all nodes in its
 * group.
 * 
 * @param {Node} node The node whose LogEvents will be added as exemptions
 */
CollapseSequentialNodesTransformation.prototype.addExemption = function(node) {
    var logEvents = node.getLogEvents();
    for (var i = 0; i < logEvents.length; i++) {
        this.exemptLogEvents[logEvents[i].getId()] = true;
    }
};

/**
 * Removes an exemption. An exemption is a LogEvent whose Node will never be
 * collapsed
 * 
 * Note that addExemption and removeExemption are not inverses of each other.
 * addExemption affects only the LogEvents of the given node, while
 * removeExemption affects the LogEvents of the given node and all nodes in its
 * group.
 * 
 * @param {Node} node The LogEvents of this node and the LogEvents of every node
 *            in its group will be removed as exemptions
 */
CollapseSequentialNodesTransformation.prototype.removeExemption = function(node) {
    if (node.hasChildren() || node.hasParents()) {
        var logEvents = node.getLogEvents();
        for (var i = 0; i < logEvents.length; i++) {
            delete this.exemptLogEvents[logEvents[i].getId()];
        }
        return;
    }

    var head = node;
    while (!head.isHead() && !head.hasChildren() && !head.hasParents()) {
        head = head.getPrev();
    }

    var tail = node;
    while (!tail.isTail() && !tail.hasChildren() && !tail.hasParents()) {
        tail = tail.getNext();
    }

    var curr = head.getNext();
    while (curr != tail) {
        var logEvents = curr.getLogEvents();
        for (var i = 0; i < logEvents.length; i++) {
            delete this.exemptLogEvents[logEvents[i].getId()];
        }
        curr = curr.getNext();
    }
};

/**
 * Toggles an exemption.
 * 
 * @param {Node} node The node to toggle.
 */
CollapseSequentialNodesTransformation.prototype.toggleExemption = function(node) {
    if (this.isExempt(node)) {
        this.removeExemption(node);
    }
    else {
        this.addExemption(node);
    }
};

/**
 * Determines if any of the LogEvents contained inside the given node is an
 * exemption
 * 
 * @param {Node} node The node to check
 * @returns {Boolean} True if one of the LogEvents is an exemption
 */
CollapseSequentialNodesTransformation.prototype.isExempt = function(node) {
    var logEvents = node.getLogEvents();
    for (var i = 0; i < logEvents.length; i++) {
        if (this.exemptLogEvents[logEvents[i].getId()]) {
            return true;
        }
    }
    return false;
};

/**
 * Performs the transformation on the given visualGraph. The VisualGraph and its
 * underlying Graph are modified in place
 * 
 * @param {VisualGraph} visualGraph The VisualGraph to transform
 */
CollapseSequentialNodesTransformation.prototype.transform = function(
        visualGraph) {

    var graph = visualGraph.getGraph();

    function collapse(curr, removalCount) {
        var logEvents = [];
        var hasHiddenParent = false;
        var hasHiddenChild = false;

        while (removalCount-- > 0) {
            var prev = curr.getPrev();
            logEvents = logEvents.concat(prev.getLogEvents().reverse());
            var removedVN = visualGraph.getVisualNodeByNode(prev);
            hasHiddenParent |= removedVN.hasHiddenParent();
            hasHiddenChild |= removedVN.hasHiddenChild();
            prev.remove();
        }
        var newNode = new Node(logEvents.reverse());
        curr.insertPrev(newNode);

        var visualNode = visualGraph.getVisualNodeByNode(newNode);
        visualNode.setRadius(15);
        visualNode.setLabel(logEvents.length);
        visualNode.setHasHiddenParent(hasHiddenParent);
        visualNode.setHasHiddenChild(hasHiddenChild);
    }

    var hosts = graph.getHosts();
    for (var i = 0; i < hosts.length; i++) {
        var host = hosts[i];

        var groupCount = 0;
        var curr = graph.getHead(host).getNext();
        while (curr != null) {

            if (curr.hasChildren() || curr.hasParents() || curr.isTail()
                    || this.isExempt(curr)) {
                if (groupCount >= this.threshold) {
                    collapse(curr, groupCount);
                }
                groupCount = -1;
            }

            groupCount++;
            curr = curr.getNext();
        }

    }

    visualGraph.update();

};

/**
 * @class
 * 
 * HighlightHostTransformation "highlights" a set of hosts by removing all edges
 * not incident on the set of highlighted nodes. The highlighted hosts are drawn
 * with a border to distinguish them from unhighlighted ones.
 * 
 * In the case that the set of hosts to highlight is empty, this transformation
 * does nothing. In the case that a specified host does not exist, it is
 * ignored.
 * 
 * @param {Array<String>} hostsToHighlight The array of hosts to highlight.
 */
function HighlightHostTransformation(hostsToHighlight) {

    this.priority = 30;

    /** @private */
    this.hosts = {};

    /** @private */
    this.hiddenHosts = [];

    for (var i = 0; i < hostsToHighlight.length; i++) {
        this.addHostToHighlight(hostsToHighlight[i]);
    }
}

/**
 * Adds a host to the set of hosts to highlight.
 * 
 * @param {String} hostToHighlight
 */
HighlightHostTransformation.prototype.addHostToHighlight = function(
        hostToHighlight) {
    this.hosts[hostToHighlight] = true;
};

/**
 * Removes a host from the set of hosts to highlight. In the case that the
 * provided host isn't in the set of hosts to highlight, this method does
 * nothing.
 * 
 * @param {String} hostToHighlight
 */
HighlightHostTransformation.prototype.removeHostToHighlight = function(
        hostToHighlight) {
    delete this.hosts[hostToHighlight];
};

/**
 * Toggles a host to and from the set of hosts to highlight. In other words, if
 * a host is currently in the set of hosts to highlight, it is removed and if it
 * isn't in that set, it is added to that set.
 * 
 * @param {String} hostToHighlight
 */
HighlightHostTransformation.prototype.toggleHostToHighlight = function(
        hostToHighlight) {
    if (!this.hosts[hostToHighlight]) {
        this.hosts[hostToHighlight] = true;
    }
    else {
        delete this.hosts[hostToHighlight];
    }
};

/**
 * Removes all hosts that are to be highlighted. No hosts will be highlighted by
 * this transformation after running this method.
 */
HighlightHostTransformation.prototype.clearHostsToHighlight = function() {
    this.hosts = {};
};

/**
 * Gets the hosts that are hidden by the transformation.
 * 
 * When hosts are highlighted, irrelevant hosts will be hidden. This method
 * returns those implicitly hidden hosts (not the hosts that are specified to be
 * hidden). Since the hosts to be hidden are only calculated when the transform
 * method is invoked, this method will return the implicity hidden hosts from
 * the last call to transform. If transform has yet to be called, this method
 * returns an empty array.
 * 
 * @returns {Array<String>} The array of hosts.
 */
HighlightHostTransformation.prototype.getHiddenHosts = function() {
    return this.hiddenHosts.slice();
};

/**
 * Performs the transformation
 * 
 * @param {VisualGraph} visualGraph
 */
HighlightHostTransformation.prototype.transform = function(visualGraph) {

    var graph = visualGraph.getGraph();

    var numHosts = 0;
    for (var key in this.hosts) {
        numHosts++;
        var head = graph.getHead(key);
        if (head != null) {
            var vn = visualGraph.getVisualNodeByNode(head);
            vn.setStrokeColor(vn.getFillColor());
            vn.setStrokeWidth(12);
        }
    }

    if (numHosts == 0) {
        this.hiddenHosts = [];
        return;
    }

    var hideHostTransformation = new HideHostTransformation();

    var hosts = graph.getHosts();
    for (var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        if (this.hosts[host]) {
            continue;
        }

        var communicated = {};
        var numCommunicated = 0;

        var curr = graph.getHead(host).getNext();
        while (!curr.isTail()) {
            var families = curr.getFamily();
            var keep = false;

            for (var j = 0; j < families.length; j++) {
                var family = families[j];
                keep |= this.hosts[family.getHost()];

                if (this.hosts[family.getHost()]
                        && !communicated[family.getHost()]) {
                    communicated[family.getHost()] = true;
                    numCommunicated++;
                }
            }

            if (!keep) {
                visualGraph.addHiddenEdgeToFamily(curr);
                curr = curr.getPrev();
                curr.getNext().remove();
            }
            curr = curr.getNext();
        }

        if (numCommunicated != numHosts) {
            hideHostTransformation.addHost(host);
        }

    }

    hideHostTransformation.transform(visualGraph);
    this.hiddenHosts = hideHostTransformation.getHostsToHide();

    visualGraph.update();
};
