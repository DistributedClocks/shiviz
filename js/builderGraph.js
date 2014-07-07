function BuilderGraph(hosts) {
    /** @private */
    this.hosts = [];

    // Dictionaries linking the host name to the head/tail node for that host
    /** @private */
    this.hostToHead = {};

    /** @private */
    this.hostToTail = {};

    /** @private */
    this.observers = {};
    
    for(var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        
        this.hosts.push(host);
        
        var head = new Node([]);
        head.isHeadInner = true;
        head.host = host;
        head.graph = this;

        var tail = new Node([]);
        tail.isTailInner = true;
        tail.host = host;
        tail.graph = this;

        head.prev = null;
        head.next = tail;

        tail.prev = head;
        tail.next = null;

        this.hostToHead[host] = head;
        this.hostToTail[host] = tail;
    }
}

BuilderGraph.prototype = Object.create(Graph.prototype);
BuilderGraph.prototype.constructor = BuilderGraph;
