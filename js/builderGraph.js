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
function BuilderGraph(hosts) {
    AbstractGraph.call(this);

    /** @private */
    this.hostSet = {};

    for (var i = 0; i < hosts.length; i++) {
        this.addHost(hosts[i]);
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
BuilderGraph.prototype.addHost = function(host) {
    if (!!this.hostSet[host]) {
        return;
    }

    this.hosts.push(host);
    this.hostSet[host] = true;

    var head = new BuilderNode();
    head.isHeadInner = true;
    head.host = host;
    head.graph = this;

    var tail = new BuilderNode();
    tail.isTailInner = true;
    tail.host = host;
    tail.graph = this;

    head.prev = null;
    head.next = tail;

    tail.prev = head;
    tail.next = null;

    this.hostToHead[host] = head;
    this.hostToTail[host] = tail;
};