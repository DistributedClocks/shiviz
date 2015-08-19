/**
 * Constructs a BuilderGraph with the specified set of hosts.
 * 
 * @classdesc
 * 
 * A BuilderGraph represents a user-defined motif. It is not the result of a
 * search for a motif, but rather it defines the motif structure that should be
 * searched for during a motif search. BuilderGraphs are so named because they
 * are the product of the user-facing graph builder. BuilderGraphs contain
 * {@link BuilderNode}s
 * 
 * @constructor
 * @extends AbstractGraph
 * @param {Array<String>} hosts The initial set of hosts
 */
function BuilderGraph(hosts, hostConstraints) {
    AbstractGraph.call(this);

    /** @private */
    this.hostSet = {};

    for (var i = 0; i < hosts.length; i++) {
        this.addHost(hosts[i], hostConstraints[i]);
    }
}

// BuilderGraph extends Graph
BuilderGraph.prototype = Object.create(AbstractGraph.prototype);
BuilderGraph.prototype.constructor = BuilderGraph;

/**
 * Adds a new host to the BuilderGraph. This method will also create the head
 * and tail nodes for that host. If the provided host name is already a valid
 * host in the BuilderGraph, this method does nothing
 * 
 * @param {String} host The name of the new host.
 */
BuilderGraph.prototype.addHost = function(host, hostConstraint) {
    if (!!this.hostSet[host]) {
        return;
    }

    this.hosts.push(host);
    this.hostSet[host] = true;

    var head = new BuilderNode();
    head.isHeadInner = true;
    head.host = host;
    head.graph = this;
    head.hasHostConstraint = hostConstraint;

    var tail = new BuilderNode();
    tail.isTailInner = true;
    tail.host = host;
    tail.graph = this;
    tail.hasHostConstraint = hostConstraint;

    head.prev = null;
    head.next = tail;

    tail.prev = head;
    tail.next = null;

    this.hostToHead[host] = head;
    this.hostToTail[host] = tail;
};

BuilderGraph.prototype.toVectorTimestamps = function() {

    var nodeToVT = {};
    var orderedNodes = [];

    for (var i = 0; i < this.hosts.length; i++) {
        var host = this.hosts[i];
        var curr = this.getHead(host).getNext();
        var num = 1;

        while (!curr.isTail()) {
            orderedNodes.push(curr);
            var clock = {};
            clock[host] = num++;
            nodeToVT[curr.getId()] = new VectorTimestamp(clock, host);
            curr = curr.getNext();
        }
    }

    this.getNodesTopologicallySorted().forEach(function(node) {
        var nodeVT = nodeToVT[node.getId()];
        node.getChildren().forEach(function(child) {
            nodeToVT[child.getId()] = nodeToVT[child.getId()].update(nodeVT);
        });
        if (!node.getNext().isTail()) {
            nodeToVT[node.getNext().getId()] = nodeToVT[node.getNext().getId()].update(nodeVT);
        }
    });

    return orderedNodes.map(function(node) {
        return nodeToVT[node.getId()];
    });
};

BuilderGraph.fromVectorTimestamps = function(vectorTimestamps, hostConstraints) {
    
    var logEvents = vectorTimestamps.map(function(vt) {
        return new LogEvent("", vt, 0, {});
    });

    var modelGraph = null;

    try {
        modelGraph = new ModelGraph(logEvents);
    }
    catch (exception) {
        if (exception.constructor != Exception) {
            throw exception;
        }
        throw new Exception("The JSON describing the structure of the motif is invalid.", true);
    }

    var hosts = modelGraph.getHosts();
    var newGraph = new BuilderGraph(hosts, hostConstraints);

    var oldToNewNode = {};

    hosts.forEach(function(host) {
        oldToNewNode[modelGraph.getHead(host).getId()] = newGraph.getHead(host);
    });

    modelGraph.getNodesTopologicallySorted().forEach(function(node) {
        var newNode = new BuilderNode();
        oldToNewNode[node.getPrev().getId()].insertNext(newNode);
        oldToNewNode[node.getId()] = newNode;

        node.getParents().forEach(function(parent) {
            newNode.addParent(oldToNewNode[parent.getId()]);
        });

        var index = hosts.indexOf(newNode.getHost());
        newNode.setHasHostConstraint(hostConstraints[index]);
    });

    return newGraph;

};