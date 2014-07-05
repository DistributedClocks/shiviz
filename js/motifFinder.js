/**
 * MotifFinders define an algorithm for finding a specific motif. Every
 * MotifFinder must implement the find(graph) method, which is solely
 * responsible for performing the actual search for motifs
 */

/**
 * @class
 * 
 * This class is responsible for finding Request-Response motifs.
 * 
 * Intuitively, a request response motif is a communication pattern between two
 * hosts where one host sends a message to a second host, and the receiving host
 * then sends something back to the first host.
 * 
 * More formally, a sequence S of k nodes n_1, n_2, n_3 ... n_k forms a
 * Request-Response motif if and only if:
 * <ul>
 * <li>k >= 3</li>
 * <li>n_1 and n_k belong to the same host (which we will call H_s)</li>
 * <li>Nodes n_2 to n_(k-1) inclusive belong to the same host (which we will
 * call H_r)</li>
 * <li>H_s != H_r</li>
 * <li>n_2 is the child of n_1</li>
 * <li>n_k is the child of n_(k-1)</li>
 * <li>Apart from the two family relations above, no nodes in S may have any
 * family if the parameter allowOtherConnections is true</li>
 * <li>nodes n_2 to n_(k-1) inclusive are consecutive</li>
 * <li>The number of nodes between n_2 and n_(k-1) is less than or equal to the
 * parameter maxLEResponder</li>
 * <li>The number of nodes between n_1 and n_k (in the graph, not in S) is less
 * than or equal to the parameter maxLERequester</li>
 * </ul>
 * 
 * The motif itself comprises all nodes in S plus all edges that connect nodes
 * adjacent in the sequence S.
 * 
 * @param {int} maxLERequester See above for the purpose of this parameter
 * @param {int} maxLEResponder See above for the purpose of this parameter
 * @param {int} allowOtherConnections See above for the purpose of this
 *            parameter
 */
function RequestResponseFinder(maxLERequester, maxLEResponder, allowOtherConnections) {
    this.maxLERequester = maxLERequester;
    this.maxLEResponder = maxLEResponder;
    this.allowOtherConnections = allowOtherConnections;
}

RequestResponseFinder.prototype.find = function(graph) {

    var nodes = graph.getNodes();
    var motif = new Motif();
    var seen = {};

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var host = node.getHost();
        var children = node.getChildren();

        if (seen[node.getId()] || (!this.allowOtherConnections && (children.length > 1 || node.hasParents()))) {
            continue;
        }

        out: for (var j = 0; j < children.length; j++) {
            var curr = children[j];
            if (seen[node.getId()] || (!this.allowOtherConnections && (curr.getParents().length > 1 || curr.getChildren().length > 1))) {
                continue;
            }

            var trail = [];

            for (var dist = 0; dist <= this.maxLEResponder && !curr.isTail(); dist++) {
                trail.push(curr);

                if (seen[node.getId()] || (!this.allowOtherConnections && curr.getFamily().length > 2 && dist > 0)) {
                    break;
                }

                var child2 = curr.getChildByHost(host);
                var curr2 = child2;

                if (curr2 != null) {

                    var count = 0;
                    while (curr2 != node) {
                        count += curr2.getLogEventCount();
                        curr2 = curr2.getPrev();
                    }

                    if (count <= this.maxLERequester) {
                        motif.addNode(child2);
                        seen[child2.getId()] = true;
                        motif.addNode(node);
                        seen[node.getId()] = true;

                        for (var a = 0; a < trail.length; a++) {
                            motif.addNode(trail[a]);
                            seen[trail[a].getId()] = true;
                        }

                        motif.addEdge(node, trail[0]);
                        for (var a = 1; a < trail.length; a++) {
                            motif.addEdge(trail[a - 1], trail[a]);
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

/**
 * @class
 * 
 * This class is responsible for finding broadcast motif.
 * 
 * Intuitively, a broadcast motif is a communication pattern where a host sends
 * messages to other hosts in quick succession.
 * 
 * More formally, a broadcast motif is sequence S of k nodes n_1, n_2, n_3 ...
 * n_k
 * <ul>
 * <li>S is a sequence of consecutive nodes</li>
 * <li>No nodes in S except n_1 may have any parents. n_1 can have any number
 * of parents.</li>
 * <li>Each node in T is the child of a node in S</li>
 * <li>Define valid-parent as follows: a node n_i is a valid-parent if it is a
 * parent of a node n_c such that n_c's host is not equal to the host of any of
 * the children of nodes n_1 to n_(i-1) inclusive.
 * <li>For all nodes n_i in S that are valid-parents let n_j be the node in S
 * with the smallest j such that j > i that is also a valid-parent. The number
 * of nodes between n_i and n_j must be less than or equal to the parameter
 * maxInBetween</li>
 * <li>Let Hosts be the set of hosts of all nodes in the set of nodes that are
 * a child of a node in S. The cardinality of Hosts must be greater than or
 * equal to the parameter minBroadcasts.
 * </ul>
 * 
 * The actual motif itself comprises all nodes in S and all nodes that are
 * children of a node in S. It also contains all edges that connect any two
 * nodes in S and all edges that connect any node in S its children.
 * 
 * @param {int} minBroadcasts See above for the purpose of this parameter
 * @param {int} maxInBetween See above for the purpose of this parameter
 * @returns
 */
function BroadcastFinder(minBroadcasts, maxInBetween, broadcast) {
    this.minBroadcasts = minBroadcasts;
    this.maxInBetween = maxInBetween;
    this.broadcast = broadcast;
};

BroadcastFinder.GREEDY_THRESHOLD = 300;

BroadcastFinder.prototype.find = function(graph) {

    var context = this;
    var finalMotif = new Motif();
    var disjoints = findDisjoint();

    for (var d = 0; d < disjoints.length; d++) {
        var disjoint = disjoints[d];

        if (disjoint.length <= BroadcastFinder.GREEDY_THRESHOLD) {
            var score = findAllBroadcasts(disjoint);
            var groups = findBestGroups(disjoint, score);
            addToMotif(groups, finalMotif);
        }
        else {
            findGreedy(disjoint, finalMotif);
        }
    }

    return finalMotif;

    function findDisjoint() {
        var ret = [];
        var hosts = graph.getHosts();
        for (var h = 0; h < hosts.length; h++) {
            var host = hosts[h];
            var group = [];
            var inBetween = 0;
            var inPattern = false;

            var curr = graph.getHead(host).getNext();
            while (curr != null) {
                var hasBadLink = context.broadcast ? curr.hasParents() : curr.hasChildren();
                var hasGoodLink = context.broadcast ? curr.hasChildren() : curr.hasParents();
                
                if (inBetween > context.maxInBetween || curr.isTail() || hasBadLink) {
                    if (inPattern && group.length != 0) {
                        ret.push(group);
                        group = [];
                        inPattern = false;
                    }

                }

                if (hasGoodLink) {
                    if (!inPattern) {
                        inPattern = true;
                        group = [];
                    }
                    inBetween = 1 - curr.getLogEventCount();
                }

                group.push(curr);
                inBetween += curr.getLogEventCount();
                curr = curr.getNext();
            }
        }
        return ret;
    }

    function findAllBroadcasts(group) {

        var score = [];

        for (var i = 0; i < group.length; i++) {

            var bcCount = 0;
            var inBetween = 0;
            var seenHosts = {};
            score[i] = [];

            for (var j = i; j < group.length; j++) {
                var curr = group[j];

                var hasValidLink = false;
                var links = context.broadcast ? curr.getChildren() : curr.getParents();
                for (var k = 0; k < links.length; k++) {
                    if (!seenHosts[links[k].getHost()]) {
                        hasValidLink = true;
                        break;
                    }
                }

                var hasBadLink = context.broadcast ? curr.hasParents() : curr.hasChildren();
                var hasGoodLink = context.broadcast ? curr.hasChildren() : curr.hasParents();
                var allowBadLink = context.broadcast && j == i;
                
                if (inBetween > context.maxInBetween || (hasBadLink && !allowBadLink) || (hasGoodLink && !hasValidLink)) {
                    break;
                }

                if (hasGoodLink) {

                    for (var k = 0; k < links.length; k++) {
                        var childHost = links[k].getHost();
                        if (!seenHosts[childHost]) {
                            bcCount++;
                            seenHosts[childHost] = true;
                        }
                    }
                    inBetween = 1 - curr.getLogEventCount();
                    score[i][j] = bcCount;
                }

                inBetween += curr.getLogEventCount();
            }
        }

        return score;
    }

    function findBestGroups(nodes, score) {
        var best = [];
        var parent = [];
        for (var i = 0; i < nodes.length; i++) {
            var max = -1;
            for (var j = 0; j <= i; j++) {
                var newScore = 0;
                var ownScore = score[j][i];
                if (!!ownScore && ownScore >= context.minBroadcasts) {
                    newScore += ownScore;
                }
                if (j > 0) {
                    newScore += best[j - 1];
                }
                if (newScore > max) {
                    max = newScore;
                    parent[i] = j - 1;
                }
            }
            best[i] = max;
        }

        var groups = [];
        var loc = nodes.length - 1;
        while (loc != -1) {
            var ploc = parent[loc];
            var groupStart = nodes[ploc + 1];
            var groupEnd = nodes[loc];
            var currScore = score[ploc + 1][loc];
            if (!!currScore && currScore >= context.minBroadcasts) {
                groups.push([ groupStart, groupEnd ]);
            }
            loc = parent[loc];
        }

        return groups;
    }

    function addToMotif(groups, motif) {
        for (var j = 0; j < groups.length; j++) {
            var curr = groups[j][0];
            var groupEnd = groups[j][1].getNext();
            var prev = null;
            var seenHosts = {};

            while (curr != groupEnd) {
                motif.addNode(curr);
                if (prev != null) {
                    motif.addEdge(curr, prev);
                }

                var links = context.broadcast ? curr.getChildren() : curr.getParents();
                for (var i = 0; i < links.length; i++) {
                    motif.addEdge(curr, links[i]);
                    motif.addNode(links[i]);
                    var linkHost = links[i].getHost();
                    if (!seenHosts[linkHost]) {
                        seenHosts[linkHost] = true;
                    }
                }

                prev = curr;
                curr = curr.getNext();
            }
        }
    }

    function findGreedy(group, motif) {
        var bcCount = 0;
        var inBetween = 0;
        var inPattern = false;
        var currMotif = new Motif();
        var queued = [];
        var nodes = [];
        var seenHosts = {};
        group = group.concat([ new Node([]) ]);

        for (var g = 0; g < group.length; g++) {
            var curr = group[g];
            queued.push(curr);

            var hasValidLink = false;
            var links = context.broadcast ? curr.getChildren() : curr.getParents();
            for (var i = 0; i < links.length; i++) {
                if (!seenHosts[links[i].getHost()]) { 
                    hasValidLink = true;
                    break;
                }
            }
            
            var hasBadLink = context.broadcast ? curr.hasParents() : curr.hasChildren();
            var hasGoodLink = context.broadcast ? curr.hasChildren() : curr.hasParents();

            if (inBetween > context.maxInBetween || (g == group.length - 1) || hasBadLink || (hasGoodLink && !hasValidLink)) {
                if (bcCount >= context.minBroadcasts) {
                    for (var i = 1; i < nodes.length; i++) {
                        currMotif.addEdge(nodes[i - 1], nodes[i]);
                    }
                    motif.merge(currMotif);
                }
                inPattern = false;
            }

            if (hasGoodLink && (context.broadcast || !hasBadLink)) {
                if (!inPattern) {
                    inPattern = true;
                    bcCount = 0;
                    inBetween = 0;
                    currMotif = new Motif();
                    queued = [ curr ];
                    seenHosts = {};
                    nodes = [];
                }

                currMotif.addAllNodes(links);
                for (var i = 0; i < links.length; i++) {
                    currMotif.addEdge(curr, links[i]);
                    var linkHost = links[i].getHost();
                    if (!seenHosts[linkHost]) {
                        bcCount++;
                        seenHosts[linkHost] = true;
                    }
                }
                currMotif.addAllNodes(queued);
                nodes = nodes.concat(queued);
                queued = [];
                inBetween = 1 - curr.getLogEventCount();
            }

            inBetween += curr.getLogEventCount();
        }
    }

};
