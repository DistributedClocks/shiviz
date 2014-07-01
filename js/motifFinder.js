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

BroadcastFinder.prototype.find2 = function(graph) {
    
    var motif = new Motif();
    
    var hosts = graph.getHosts();
    for(var j = 0; j < hosts.length; j++) {
        var host = hosts[j];
        var bcCount = 0;
        var inBetween = 0;
        var inPattern = false;
        var currMotif = new Motif();
        var queued = [];
        var broadcastingNodes = [];
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
                    for(var i = 1; i < broadcastingNodes.length; i++) {
                        currMotif.addEdge(broadcastingNodes[i-1], broadcastingNodes[i]);
                    }
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
                    broadcastingNodes = [];
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
                broadcastingNodes = broadcastingNodes.concat(queued);
                queued = [];
                inBetween = 1 - curr.getLogEventCount();
            }
            
            inBetween += curr.getLogEventCount();
            curr = curr.getNext();
        }
    }
    
    return motif;
};


BroadcastFinder.prototype.find = function(graph) {
    
    function getPairId(node1, node2) {
        return Math.min(node1.getId(), node2.getId()) + ":" + Math.max(node1.getId(), node2.getId());
    }
    
    var motif = new Motif();
    
    var hosts = graph.getHosts();
    for(var h = 0; h < hosts.length; h++) {
        var host = hosts[h];
        var score = {};
        var nodes = [];
        
        var start = graph.getHead(host).getNext();
        while(!start.isTail()) {
            var bcCount = 0;
            var inBetween = 0;
            var seenHosts = {};
            nodes.push(start);
            
            var curr = start;
            while(curr != null) {
                
                var hasValidChild = false;
                var children = curr.getChildren();
                for(var i = 0; i < children.length; i++) {
                    if(!seenHosts[children[i].getHost()]) {
                        hasValidChild = true;
                        break;
                    }
                }
                
                if(inBetween > this.maxInBetween || curr.isTail() || curr.hasParents() || (curr.hasChildren() && !hasValidChild)) {
                    break;
                }
                
                if(curr.hasChildren()) {
                    
                    for(var i = 0; i < children.length; i++) {
                        var childHost = children[i].getHost();
                        if(!seenHosts[childHost]) {
                            bcCount++;
                            seenHosts[childHost] = true;
                        }
                    }
                    inBetween = 1 - curr.getLogEventCount();
                    score[getPairId(curr, start)] = bcCount;
                }
                
                inBetween += curr.getLogEventCount();
                curr = curr.getNext();
            }
            
            start = start.getNext();
        }
        
        var best = [];
        var parent = [];
        for(var i = 0; i < nodes.length; i++) {
            var max = -1;
            for(var j = 0; j <= i; j++) {
                var newScore = 0;
                var ownScore = score[getPairId(nodes[j], nodes[i])];
                if(!!ownScore && ownScore >= this.minBroadcasts) {
                    newScore += ownScore;
                }
                if(j > 0) {
                    newScore += best[j-1];
                }
                if(newScore > max) {
                    max = newScore;
                    parent[i] = j-1;
                }
            }
            best[i] = max;
        }
        
        var groups = [];
        var loc = nodes.length - 1;
        while(loc != -1) {
            var ploc = parent[loc];
            var groupStart = nodes[ploc + 1];
            var groupEnd = nodes[loc];
            var currScore = score[getPairId(groupStart, groupEnd)];
            if(!!currScore && currScore >= this.minBroadcasts) {
                groups.push([groupStart, groupEnd]);
            }
            loc = parent[loc];
        }
        
        for(var j = 0; j < groups.length; j++) {
            var curr = groups[j][0];
            var groupEnd = groups[j][1].getNext();
            var prev = null;
            var seenHosts = {};
            
            while(curr != groupEnd) {
                motif.addNode(curr);
                if(prev != null) {
                    motif.addEdge(curr, prev);
                }
                
                if(curr.hasChildren()) {
                    var children = curr.getChildren();
                    for(var i = 0; i < children.length; i++) {
                        motif.addEdge(curr, children[i]);
                        motif.addNode(children[i]);
                        var childHost = children[i].getHost();
                        if(!seenHosts[childHost]) {
                            seenHosts[childHost] = true;
                        }
                    }
                }
                
                prev = curr;
                curr = curr.getNext();
            }
        }
    }
    
    return motif;
};
