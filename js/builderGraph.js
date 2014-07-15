BuilderGraph.prototype = Object.create(Graph.prototype);
BuilderGraph.prototype.constructor = BuilderGraph;

function BuilderGraph(hosts) {
   Graph.call(this);
    
    for(var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        
        this.hosts.push(host);
        
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
    }
}