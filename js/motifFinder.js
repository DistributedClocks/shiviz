/**
 * MotifFinders define an algorithm for finding a specific motif.
 * Every MotifFinder must implement the find(graph) method.
 */

function RequestResponseFinder(maxLERequester, maxLEResponder, allowOtherConnections) {
    this.maxLERequester = maxLERequester;
    this.maxLEResponder = maxLEResponder;
    this.allowOtherConnections = allowOtherConnections;
}

RequestResponseFinder.prototype.find = function(graph) {
    
    var nodes = graph.getNodes();
    var motif = new Motif();
    
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var host = node.getHost();
        var children = node.getChildren();
        
        if(!this.allowOtherConnections && (children.length > 1 || node.hasParents())) {
            continue;
        }
        
        out: for(var j = 0; j < children.length; j++) {
            var curr = children[j];
            if(!this.allowOtherConnections && (curr.getParents().length > 1 || curr.getChildren().length > 1)) {
                continue;
            }
            
            var trail = [];
            
            for(var dist = 0; dist <= this.maxLEResponder && !curr.isTail(); dist++) {
                trail.push(curr);
                
                if(!this.allowOtherConnections && curr.getFamily().length > 2 && dist > 0) {
                    break;
                }
                
                var child2 = curr.getChildByHost(host);
                var curr2 = child2;
                
                if(curr2 != null) {
                    
                    var count = 0;
                    while(curr2 != node) {
                        count += curr2.getLogEventCount();
                        curr2 = curr2.getPrev();
                    }
                    
                    if(count <= this.maxLERequester) {
                        motif.addNode(child2);
                        motif.addNode(node);
                        for(var a = 0; a < trail.length; a++) {
                            motif.addNode(trail[a]);
                        }
                        
                        motif.addEdge(node, trail[0]);
                        for(var a = 1; a < trail.length; a++) {
                            motif.addEdge(trail[a-1], trail[a]);
                        }
                        motif.addEdge(trail[trail.length - 1], child2);
                        break out;
                    }
                }
                curr = curr.getNext();
            }
        }
    }
    
    return motif;
};


function BroadcastFinder(minBroadcasts, maxInBetween) {
    this.minBroadcasts = minBroadcasts;
    this.maxInBetween = maxInBetween;
};

BroadcastFinder.prototype.find = function(graph) {
    
    var motif = new Motif();
    
    var hosts = graph.getHosts();
    for(var j = 0; j < hosts.length; j++) {
        var host = hosts[j];
        var bcCount = 0;
        var inBetween = 0;
        var inPattern = false;
        var currMotif = new Motif();
        var queued = [];
        var seenHosts = {};
        
        var curr = graph.getHead(host).getNext();
        while(curr != null) {
            queued.push(curr);
            
            var hasValidChild = false;
            var children = curr.getChildren();
            for(var i = 0; i < children.length; i++) {
                if(!seenHosts[children[i].getHost()]) {
                    hasValidChild = true;
                    break;
                }
            }
            
            if(inBetween > this.maxInBetween || curr.isTail() || curr.hasParents() || (curr.hasChildren() && !hasValidChild)) {
                if(bcCount >= this.minBroadcasts) {
                    motif.merge(currMotif);
                }
                inPattern = false;
            }
            
            if(curr.hasChildren()) {
                if(!inPattern) {
                    inPattern = true;
                    bcCount = 0;
                    inBetween = 0;
                    currMotif = new Motif();
                    queued = [curr];
                    seenHosts = {};
                }
                
                currMotif.addAllNodes(children);
                for(var i = 0; i < children.length; i++) {
                    currMotif.addEdge(curr, children[i]);
                    var childHost = children[i].getHost();
                    if(!seenHosts[childHost]) {
                        bcCount++;
                        seenHosts[childHost] = true;
                    }
                }
                currMotif.addAllNodes(queued);
                queued = [];
                inBetween = 0;
            }
            
            inBetween += curr.getLogEventCount();
            curr = curr.getNext();
        }
    }
    
    return motif;
};
