/**
 * @classdesc
 * 
 * <p>
 * This class is responsible for finding broadcast or gather motif.
 * </p>
 * 
 * <p>
 * Intuitively, a broadcast motif is a communication pattern where a host sends
 * messages to other hosts in quick succession. A gather motif then is where
 * multiple hosts send messages to a single one in quick succession.
 * </p>
 * 
 * <p>
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
 * equal to the parameter minBroadcastGather.
 * </ul>
 * </p>
 * 
 * <p>
 * The actual motif itself comprises all nodes in S and all nodes that are
 * children of a node in S. It also contains all edges that connect any two
 * nodes in S and all edges that connect any node in S its children.
 * </p>
 * 
 * <p>
 * The formal definition of a gather motif is analogous to broadcast. In the
 * formal definition above, replace child(ren) with parent(s) and parent(s) with
 * child(ren). One difference for gather is that no nodes in S INCLUDING n_1 may
 * have any parents.
 * </p>
 * 
 * @constructor
 * @extends MotifFinder
 * @param {int} minBroadcastGather Minimum amount of broadcasts or gathers
 *            needed to accept a motif
 * @param {int} maxInBetween Maximum number of non-broadcasting or gathering
 *            nodes allowed since previous broadcasting or gathering one. This
 *            number includes the last broadcasting or gathering node itself.
 *            For example, if you set this to 1, the finder will allow ZERO
 *            nodes between broadcast/gather nodes (in other words, ONE node
 *            since the previous broadcast/gather node including that one)
 * @param {Boolean} broadcast Set to true to find broadcasts. Set to false to
 *            find gathers
 */
function BroadcastGatherFinder(minBroadcastGather, maxInBetween, broadcast) {
    
    /** @private */
    this.minBroadcastGather = minBroadcastGather;
    
    /** @private */
    this.maxInBetween = maxInBetween;
    
    /** @private */
    this.broadcast = broadcast;
};

// BroadcastGatherFinder extends MotifFinder
BroadcastGatherFinder.prototype = Object.create(MotifFinder.prototype);
BroadcastGatherFinder.prototype.constructor = BroadcastGatherFinder;

/**
 * 
 * @private
 * @static
 */
BroadcastGatherFinder.GREEDY_THRESHOLD = 300;

/**
 * Overrides {@link MotifFinder#find}
 */
BroadcastGatherFinder.prototype.find = function(graph) {

    var context = this; // Used by inner functions

    var motifGroup = new MotifGroup();
    var disjoints = findDisjoint();

    for (var d = 0; d < disjoints.length; d++) {
        var disjoint = disjoints[d];

        if (disjoint.length <= BroadcastGatherFinder.GREEDY_THRESHOLD) {
            var score = findAll(disjoint);
            var groups = findBestGroups(disjoint, score);
            motifGroup.addMotif(toMotif(groups));
        }
        else {
            findGreedy(disjoint, finalMotif);
        }
    }

    return motifGroup;

    // Finds disjoint groups of potential broadcasts/gathers
    function findDisjoint() {
        var ret = [];

        var hosts = graph.getHosts();
        for (var h = 0; h < hosts.length; h++) {
            var host = hosts[h];
            var group = []; // The current disjoint group
            var inBetween = 0;
            var inPattern = false;

            var curr = graph.getHead(host).getNext();
            while (curr != null) {

                var hasBadLink = context.broadcast ? curr.hasParents() : curr.hasChildren();
                var hasGoodLink = context.broadcast ? curr.hasChildren() : curr.hasParents();

                // If curr can't be part of the current group, push group and
                // start a new group for curr
                if (inBetween > context.maxInBetween || curr.isTail() || hasBadLink) {
                    if (inPattern && group.length != 0) {
                        ret.push(group);
                        group = [];
                        inPattern = false;
                    }

                }

                if (hasGoodLink) {
                    // if not currently in broadcast/gather pattern, clear group
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

    /*
     * Finds a broadcasts/gathers within the group. O(n^2) returns score array
     * where score[i][j] = number of broadcasts between ith and jth node in
     * group inclusive ONLY IF they form a valid broadcast motif
     */
    function findAll(group) {

        var score = [];

        for (var i = 0; i < group.length; i++) {

            var count = 0; // current broadcast/gather count
            var inBetween = 0; // Nodes since last valid broadcasting/gathering
            // node
            var seenHosts = {};
            score[i] = [];

            for (var j = i; j < group.length; j++) {
                var curr = group[j];

                // Check if curr has a valid link (a link to a host that hasn't
                // been seen yet)
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
                // we allow parent links for the first node of a broadcast
                var allowBadLink = context.broadcast && j == i;

                // (hasGoodLink && !hasValidLink) == has children/parents, but
                // all of them are to hosts already seen
                if (inBetween > context.maxInBetween || (hasBadLink && !allowBadLink) || (hasGoodLink && !hasValidLink)) {
                    break;
                }

                if (hasGoodLink) {
                    for (var k = 0; k < links.length; k++) {
                        var childHost = links[k].getHost();
                        if (!seenHosts[childHost]) {
                            count++;
                            seenHosts[childHost] = true;
                        }
                    }
                    inBetween = 1 - curr.getLogEventCount();
                    score[i][j] = count;
                }

                inBetween += curr.getLogEventCount();
            }
        }

        return score;
    }

    // Finds the best partition of nodes into broadcast motifs
    function findBestGroups(nodes, score) {
        var best = []; // best[i] = max score using nodes 0 to i inclusive
        var parent = [];

        // Find max score using O(n^2) dynamic programming
        // dp recurrence: best[i] = max(best[j-1] + score[j][i]) for all 0<=j<=i
        for (var i = 0; i < nodes.length; i++) {
            var max = -1;
            for (var j = 0; j <= i; j++) {
                var newScore = 0;
                var ownScore = score[j][i];
                if (!!ownScore && ownScore >= context.minBroadcastGather) {
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

        // backtrack dp to recover the actual groups of nodes
        var groups = [];
        var loc = nodes.length - 1;
        while (loc != -1) {
            var ploc = parent[loc];
            var groupStart = nodes[ploc + 1];
            var groupEnd = nodes[loc];
            var currScore = score[ploc + 1][loc];
            if (!!currScore && currScore >= context.minBroadcastGather) {
                groups.push([ groupStart, groupEnd ]);
            }
            loc = parent[loc];
        }

        return groups;
    }

    // Creates a motif out of the groups
    function toMotif(groups) {
        var motif = new Motif();
        
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
        
        return motif;
    }

    // Alternate greedy solution. Used when O(n^2) dp is too slow
    function findGreedy(group, motif) {
        var bcCount = 0;
        var inBetween = 0;
        var inPattern = false;
        var currMotif = new Motif();
        var queued = [];
        var nodes = [];
        var seenHosts = {};
        group = group.concat([ new ModelNode([]) ]);

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
                if (bcCount >= context.minBroadcastGather) {
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
