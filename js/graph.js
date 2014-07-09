/**
 * A Graph contains the hosts and Nodes that makes up the model.
 * 
 * A Graph can be thought of as a set of augmented linked-lists. Each host is
 * associated with a linked-list that is "augmented" in the sense that nodes can
 * also be connected to nodes in other linked lists. The first and last nodes in
 * each linked list are dummy head and tail nodes respectively.
 * 
 * Traversing a Graph is much like traversing a linked list. For example, to
 * visit all nodes whose host is equal to "loadBalancer":
 * 
 * <pre>
 * var currentNode = this.getHeadByHost('loadBalancer').getNext();
 * while (!currentNode.isTail()) {
 *     // do something to currentNode
 *     currentNode = currentNode.getNext();
 * }
 * </pre>
 * 
 * The Graph class makes the following guarantees about nodes in the Graph:
 * <li>node.getNext() == null if and only if node.isTail() == true</li>
 * <li>node.getPrev() == null if and only if node.isHead() == true</li>
 * 
 * Graph implements the observer pattern. Graph will notify registered observers
 * when certain events happen such as the removal of a node, the addition of
 * edges between nodes, removal of a host, etc
 */

/**
 * @constructor
 * @param {[LogEvent]} logEvents an array of log events extracted from the raw
 *        log input
 */
function Graph(logEvents) {
    /** @private */
    this.hosts = [];

    // Dictionaries linking the host name to the head/tail node for that host
    /** @private */
    this.hostToHead = {};

    /** @private */
    this.hostToTail = {};

    /** @private */
    this.observers = {};

    // Dictionary linking host name to array of nodes
    var hostToNodes = {};

    // Set of existing hosts
    var hostSet = {};

    for (var i = 0; i < Graph.validEvents.length; i++) {
        this.observers[Graph.validEvents[i]] = {};
    }

    /*
     * Create and add nodes to host arrays. Initialize hosts if undefined by
     * adding them to hostSet and assigning head and tail dummy nodes
     */
    for (var i = 0; i < logEvents.length; i++) {
        var logEvent = logEvents[i];
        var host = logEvent.getHost();
        var node = new Node([ logEvent ]);
        node.host = host;
        node.graph = this;

        if (hostSet[host] == undefined) {
            hostSet[host] = true;
            this.hosts.push(host);
            hostToNodes[host] = [];

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

        hostToNodes[host].push(node);
    }

    // Sort the hosts by number of nodes descending
    this.hosts.sort(function(a, b) {
        return hostToNodes[b].length - hostToNodes[a].length;
    });

    // Generate linear linked list among nodes in same host
    for (var host in hostToNodes) {
        var array = hostToNodes[host];
        array.sort(function(a, b) {
            return a.logEvents[0].getVectorTimestamp().compareToLocal(b.logEvents[0].getVectorTimestamp());
        });

        for (var i = 0; i < array.length; i++) {

            var node = array[i];
            var logEvent = node.getLogEvents()[0];
            var vt = logEvent.getVectorTimestamp();
            var time = vt.getOwnTime();

            if (time != i + 1) {
                if (i == 0) {
                    var exception = new Exception("Logical clock values for each host must start at 1.\n" + "The clock value for the first event for host \"" + node.getHost() + "\" is " + time + ".");
                    attachEvent(logEvent, exception);
                    exception.setUserFriendly(true);
                    throw exception;
                }
                else {
                    var lastNode = array[i - i];
                    var lastLogEvent = lastNode.getLogEvents()[0];
                    var lastVt = lastLogEvent.getVectorTimestamp();
                    var lastTime = lastVt.getOwnTime();

                    var exception = new Exception("Clock values for a host must increase monotonically by 1.\n" + "The clock for host \"" + node.getHost() + "\" goes from " + lastTime + " to " + time + " in the following two events:\n");
                    attachEvent(lastLogEvent, exception);
                    attachEvent(logEvent, exception);
                    exception.setUserFriendly(true);
                    throw exception;
                }
            }
        }

        var lastNode = this.hostToHead[host];

        for (var i = 0; i < array.length; i++) {
            var newNode = array[i];
            lastNode.insertNext(newNode);
            lastNode = newNode;
        }
    }

    // Generates parent/child connections
    for (var host in hostSet) {
        // Latest clock
        var clock = {};
        var currNode = this.hostToHead[host].next;
        var tail = this.hostToTail[host];

        while (currNode != tail) {
            // Candidates is array of potential parents for
            // currNode

            var candidates = [];
            var currVT = currNode.logEvents[0].getVectorTimestamp();
            clock[host] = currVT.ownTime;

            // Looks to see if a timestamp for a host in the
            // vector clock has been updated from the last one
            for (var otherHost in currVT.clock) {
                var time = currVT.clock[otherHost]; // TODO: use method

                // If the timestamp for the host has been updated
                // then add the node in otherHost with timestamp
                // time to the list of candidates
                if (clock[otherHost] == undefined || clock[otherHost] < time) {
                    clock[otherHost] = time;

                    if (hostSet[otherHost] == undefined) {
                        var exception = new Exception("The following event's vector clock contains an entry for " + "an unrecognized host \"" + otherHost + "\".");
                        attachEvent(currNode.logEvents[0], exception);
                        exception.setUserFriendly(true);
                        throw exception;
                    }

                    if (time < 1 || time > hostToNodes[otherHost].length) {
                        var exception = new Exception("The following event's vector clock contains an invalid clock value " + time + " for " + "host \"" + otherHost + "\".");
                        attachEvent(currNode.logEvents[0], exception);
                        exception.setUserFriendly(true);
                        throw exception;
                    }

                    candidates.push(hostToNodes[otherHost][time - 1]);
                }
            }

            // Gather all candidates into connections
            var connections = {};
            for (var i = 0; i < candidates.length; i++) {
                var vt = candidates[i].logEvents[0].getVectorTimestamp();
                var id = vt.getOwnHost() + ":" + vt.getOwnTime();
                connections[id] = candidates[i];
            }

            for (var i = 0; i < candidates.length; i++) {
                var vt = candidates[i].logEvents[0].getVectorTimestamp();
                for (var otherHost in vt.clock) {
                    if (otherHost != vt.getOwnHost()) {
                        var id = otherHost + ":" + vt.clock[otherHost];
                        delete connections[id];
                    }
                }
            }

            // figure out which child to keep
            for (var key in connections) {
                var node = connections[key];
                var currParentOnHost = currNode.hostToParent[node.getHost()];
                if (!currParentOnHost) {
                    currNode.addParent(node);
                    continue;
                }
                var newTime = node.getLogEvents()[0].getVectorTimestamp().ownTime;
                var oldTime = currParentOnHost.getLogEvents()[0].getVectorTimestamp().ownTime;
                if (newTime > oldTime) {
                    currNode.addParent(node);
                }

            }

            currNode = currNode.next;
        }
    }

    // Step through and verify that the vector clocks make sense
    var clocks = {}; // clocks[x][y] = vector clock of host x at local time y
    for (var host in hostSet) {
        clocks[host] = {};
    }

    for (var host in hostSet) {
        var curr = this.getHead(host).getNext();
        var time = 0;
        while (!curr.isTail()) {
            var clock = {};
            clock[host] = ++time;
            clocks[host][time] = new VectorTimestamp(clock, host);
            curr = curr.getNext();
        }
    }

    var sortedNodes = null;
    try {
        sortedNodes = this.getNodesTopologicallySorted();
    }
    catch (e) {
        throw new Exception("An error occured. The log is intransitive. That is, there are three events x, y, and z such that x occurs before y, y occurs before z, and z before x.", true)
    }

    for (var i = 0; i < sortedNodes.length; i++) {
        var curr = sortedNodes[i];
        var host = curr.getHost();
        var time = curr.getLogEvents()[0].getVectorTimestamp().getOwnTime();

        var children = curr.getChildren();
        if (!curr.getNext().isTail()) {
            children.push(curr.getNext());
        }

        for (var j = 0; j < children.length; j++) {
            var childHost = children[j].getHost();
            var childTime = children[j].getLogEvents()[0].getVectorTimestamp().getOwnTime();
            clocks[childHost][childTime] = clocks[childHost][childTime].update(clocks[host][time]);
        }

        if (!clocks[host][time].equals(curr.getLogEvents()[0].getVectorTimestamp())) {
            var exception = new Exception("The following event has an impermissible vector clock.\n");
            attachEvent(curr.getLogEvents()[0], exception);
            exception.append("We think it should be:");
            exception.append(JSON.stringify(clocks[host][time].clock), "code");
            exception.setUserFriendly(true);
            throw exception;
        }
    }

    function attachEvent(event, exception) {
        var vt = event.getVectorTimestamp();
        exception.append("\nOn line " + event.getLineNumber() + ":");
        exception.append(event.getText() + "\n" + JSON.stringify(vt.clock), "code")
    }

}

/**
 * Define valid events here.
 * 
 * @static
 * @private
 */
Graph.validEvents = [ AddNodeEvent, RemoveNodeEvent, AddFamilyEvent, RemoveFamilyEvent, RemoveHostEvent, ChangeEvent ];

/**
 * Gets the head node for a host
 * 
 * @param {String} host the name of the host
 * @return {Node} the head node, or null if none is found
 */
Graph.prototype.getHead = function(host) {
    if (!this.hostToHead[host]) {
        return null;
    }
    return this.hostToHead[host];
};

/**
 * Gets the tail node for a host
 * 
 * @param {String} host the name of the host
 * @return {Node} the tail node, or null if none is found
 */
Graph.prototype.getTail = function(host) {
    if (!this.hostToTail[host]) {
        return null;
    }
    return this.hostToTail[host];
};

/**
 * Gets the hosts as an array
 * 
 * @return {[String]} a copy of the array of host names
 */
Graph.prototype.getHosts = function() {
    return this.hosts.slice(0);
};

/**
 * Checks if this graph has the specified host
 * 
 * @param {String} host The host to check for
 * @returns {Boolean} True if the host exists
 */
Graph.prototype.hasHost = function(host) {
    if (!this.hostToTail[host]) {
        return false;
    }
    return true;
};

/**
 * Removes a host from the model. All connections to and from this host will be
 * removed. If the host doesn't exist, this method does nothing
 * 
 * @param {String} host the name of the host to hide
 */
Graph.prototype.removeHost = function(host) {
    var index = this.hosts.indexOf(host);
    if (index < 0) {
        return;
    }

    this.hosts.splice(index, 1);

    var head = this.getHead(host);
    var curr = head.getNext();
    while (!curr.isTail()) {
        var next = curr.getNext();
        curr.remove();
        curr = next;

    }

    delete this.hostToHead[host];
    delete this.hostToTail[host];

    this.notify(new RemoveHostEvent(host, head));
};

/**
 * Gets all non-dummy (i.e non-head and non-tail) nodes in the graph as an
 * array.
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of nodes.
 * 
 * @return {[Node]} an array of all non-dummy nodes
 */
Graph.prototype.getNodes = function() {
    var nodes = [];
    for (var i = 0; i < this.hosts.length; i++) {
        var curr = this.getHead(this.hosts[i]).getNext();

        while (!curr.isTail()) {
            nodes.push(curr);
            curr = curr.getNext();
        }
    }
    return nodes;
};

/**
 * Gets all dummy (head/tail) nodes in the graph as an array.
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of nodes.
 * 
 * @return {[Node]} an array of all dummy nodes
 */
Graph.prototype.getDummyNodes = function() {
    var nodes = [];
    for (var host in this.hostToHead) {
        nodes.push(this.hostToHead[host]);
    }

    for (var host in this.hostToTail) {
        nodes.push(this.hostToTail[host]);
    }
    return nodes;
};

/**
 * Gets all nodes including dummy nodes
 * 
 * This function makes no guarantees about the ordering of nodes in the array
 * returned. Also note that a new array is created to prevent modification of
 * the underlying private data structure, so this function takes linear rather
 * than constant time on the number of nodes.
 * 
 * @return {[Node]} an array of all nodes in the model
 */
Graph.prototype.getAllNodes = function() {
    return this.getNodes().concat(this.getDummyNodes());
};

/**
 * Returns the non-dummy nodes of the graph in topologically sorted order. A
 * topologically sorted order is one where, for all i and j such that j > i,
 * there does not exist a directed edge from nodes[j] to nodes[i].
 * 
 * @returns {Array<Node>} the nodes in topologically sorted order.
 * @throws An exception if the graph contains a cycle.
 */
Graph.prototype.getNodesTopologicallySorted = function() {
    toposort = [];

    var inDegree = {}; // mapping of node ID to current in degree
    var ready = [];
    var nodes = this.getNodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        inDegree[node.getId()] = node.getParents().length;
        if (!node.getPrev().isHead()) {
            inDegree[node.getId()]++;
        }

        if (inDegree[node.getId()] == 0) {
            ready.push(node);
        }
    }

    while (ready.length > 0) {
        var curr = ready.pop();
        toposort.push(curr);

        var others = curr.getChildren();
        if (!curr.getNext().isTail()) {
            others.push(curr.getNext());
        }

        for (var i = 0; i < others.length; i++) {
            var other = others[i];
            inDegree[other.getId()]--;

            if (inDegree[other.getId()] == 0) {
                ready.push(other);
            }
        }
    }

    for (var key in inDegree) {
        if (inDegree[key] > 0) {
            throw new Exception("Graph.prototype.getNodesTopologicallySorted: Cannot perform topological sort - graph is not acyclic");
        }
    }

    return toposort;
};

/**
 * Returns a copy of the graph. The new graph has nodes connected in exactly the
 * same way as the original. The new graph has exactly the same set of hosts.
 * The node themselves are shallow copies provided by node.clone()
 * 
 * @return {Graph} The copy of the graph
 */
Graph.prototype.clone = function() {
    var newGraph = new Graph([]);
    newGraph.hosts = this.getHosts();

    var allNodes = this.getAllNodes();
    var oldToNewNode = {};
    for (var i = 0; i < allNodes.length; i++) {
        var node = allNodes[i];
        var newNode = new Node(node.getLogEvents());
        newNode.host = node.getHost();
        newNode.graph = newGraph;
        newNode.isHeadInner = node.isHeadInner;
        newNode.isTailInner = node.isTailInner;
        oldToNewNode[node.getId()] = newNode;
    }

    for (var host in this.hostToHead) {
        var node = this.hostToHead[host];
        newGraph.hostToHead[host] = oldToNewNode[node.getId()];
    }

    for (var host in this.hostToTail) {
        var node = this.hostToTail[host];
        newGraph.hostToTail[host] = oldToNewNode[node.getId()];
    }

    for (var i = 0; i < allNodes.length; i++) {
        var node = allNodes[i];
        var newNode = oldToNewNode[node.getId()];

        if (node.prev != null) {
            newNode.prev = oldToNewNode[node.prev.getId()];
        }

        if (node.next != null) {
            newNode.next = oldToNewNode[node.next.getId()];
        }

        var children = node.getChildren();
        for (var j = 0; j < children.length; j++) {
            var child = children[j];
            newNode.addChild(oldToNewNode[child.getId()]);
        }

    }

    return newGraph;
};

/**
 * Adds an observer to this graph. The observer will be notified (by invoking
 * the provided callback function) of events when events of the specified type
 * occur. There cannot exist two observers that are identical. The newly added
 * observer will replace another if it is identical to the other one. Two
 * observers are considered identical if they were registered with the same type
 * and callback.
 * 
 * @param {Function} type The type of event you want to observe. Use the
 *        constructor function of the event class. For example, if you want to
 *        observe AddNodeEvents, type would just be "AddNodeEvent".
 * @param {Object} context This object will be provided to the callback function
 *        when it is invoked.
 * @param {Function} callback The callback function. The parameters of the
 *        callback should be event, context
 */
Graph.prototype.addObserver = function(type, context, callback) {
    if (Graph.validEvents.indexOf(type) < 0) {
        throw new Exception("Graph.prototype.addObserver: " + type + " is not a valid event");
    }

    this.observers[type][callback] = {
        callback: callback,
        context: context
    };
};

/**
 * Removes an observer from this graph. If the specified observer cannot be
 * found, this function does nothing.
 * 
 * @param {Function} type The type of event you want to observe. Use the
 *        constructor function of the event class. For example, if you want to
 *        remove an observer for AddNodeEvents, type would just be
 *        "AddNodeEvent".
 * @param {Function} callback The callback function.
 */
Graph.prototype.removeObserver = function(type, callback) {
    if (Graph.validEvents.indexOf(type) < 0) {
        throw new Exception("Graph.prototype.removeObserver: " + type + " is not a valid event");
    }

    delete this.observers[type][callback];
};

/**
 * Notifies all registered observers of an event. Dispatching any event will
 * also dispatch a ChangeEvent. Note that you cannot directly dispatch a
 * ChangeEvent.
 * 
 * You should only notify observers of events after the corresponding action has
 * been completed. For example, a RemoveNodeEvent should only be dispatched
 * after the node has been removed from the graph and the prev and next nodes of
 * the removed node have been linked.
 * 
 * @private
 * @param {Event} event The event object to dispatch.
 */
Graph.prototype.notify = function(event) {
    if (Graph.validEvents.indexOf(event.constructor) < 0) {
        throw new Exception("Graph.prototype.notify: " + type + " is not a valid event");
    }

    if (event.constructor == ChangeEvent) {
        throw new Exception("Graph.prototype.notify: You cannot directly dispatch a ChangeEvent.");
    }

    var params = this.observers[event.constructor];
    for (var key in params) {
        var param = params[key];
        param.callback(event, param.context);
    }

    var changeEventParams = this.observers[ChangeEvent];
    for (var key in changeEventParams) {
        var curr = changeEventParams[key];
        curr.callback(event, curr.context);
    }
};

/**
 * Dispatchable events are specified below. Each class below is associated with
 * an event. For example, an AddNodeEvent indicates that a new node has been
 * added to the graph.
 */

/**
 * AddNodeEvents indicate that a new node has been added to the graph. This also
 * implies that prev/next edges of the prev and next nodes of the new node have
 * been change accordingly to accomodate the new node.
 * 
 * @constructor
 * @param {Node} newNode The new node that has been added
 * @param {Node} prev newNode's previous node
 * @param {Node} next newNode's next node
 */
function AddNodeEvent(newNode, prev, next) {
    this.newNode = newNode;
    this.prev = prev;
    this.next = next;
};

/**
 * Returns the newly added node that corresponds to the event.
 * 
 * @returns {Node} the newly added node.
 */
AddNodeEvent.prototype.getNewNode = function() {
    return this.newNode;
};

/**
 * Returns the previous node of the newly added node that corresponds to the
 * event.
 * 
 * @returns {Node} the prev node.
 */
AddNodeEvent.prototype.getPrev = function() {
    return this.prev;
};

/**
 * Returns the next node of the newly added node that corresponds to the event.
 * 
 * @returns {Node} the next node.
 */
AddNodeEvent.prototype.getNext = function() {
    return this.next;
};

/**
 * RemoveNodeEvent indicates that a node has been removed from the graph. This
 * also implies that prev/next edges of the prev and next nodes of the removed
 * node have been change accordingly
 * 
 * @constructor
 * @param {Node} removedNode The new node that has been removed
 * @param {Node} prev newNode's previous node
 * @param {Node} next newNode's next node
 */
function RemoveNodeEvent(removedNode, prev, next) {
    this.removedNode = removedNode;
    this.prev = prev;
    this.next = next;
};

/**
 * Returns the removed node that corresponds to the event.
 * 
 * @returns {Node} the removed node.
 */
RemoveNodeEvent.prototype.getRemovedNode = function() {
    return this.removedNode;
};

/**
 * Returns the previous node of the removed node that corresponds to the event.
 * 
 * @returns {Node} the prev node.
 */
RemoveNodeEvent.prototype.getPrev = function() {
    return this.prev;
};

/**
 * Returns the next node of the removed node that corresponds to the event.
 * 
 * @returns {Node} the next node.
 */
RemoveNodeEvent.prototype.getNext = function() {
    return this.next;
};

/**
 * AddFamilyEvent indicates that a new family relationship has been created
 * between two nodes
 * 
 * @constructor
 * @param {Node} parent The parent node in the newly created family relationship
 *        (i.e the node that gained a new child)
 * @param {Node} child The child node in the newly created family relationship
 *        (i.e the node that gained a new parent)
 */
function AddFamilyEvent(parent, child) {
    this.parent = parent;
    this.child = child;
}

/**
 * Returns the parent node in the newly created family relationship that
 * corresponds to the event.
 * 
 * @returns {Node} The parent node
 */
AddFamilyEvent.prototype.getParent = function() {
    return this.parent;
};

/**
 * Returns the child node in the newly created family relationship that
 * corresponds to the event.
 * 
 * @returns {Node} The child node
 */
AddFamilyEvent.prototype.getChild = function() {
    return this.child;
};

/**
 * RemoveFamilyEvent indicates that a family relationship has been removed
 * between two nodes
 * 
 * @constructor
 * @param {Node} parent The parent node in the removed family relationship (i.e
 *        the node that lost a new child)
 * @param {Node} child The child node in the removed family relationship (i.e
 *        the node that lost a new parent)
 */
function RemoveFamilyEvent(parent, child) {
    this.parent = parent;
    this.child = child;
}

/**
 * Returns the parent node in the removed family relationship that corresponds
 * to the event.
 * 
 * @returns {Node} The parent node
 */
RemoveFamilyEvent.prototype.getParent = function() {
    return this.parent;
};

/**
 * Returns the child node in the removed family relationship that corresponds to
 * the event.
 * 
 * @returns {Node} The child node
 */
RemoveFamilyEvent.prototype.getChild = function() {
    return this.child;
};

/**
 * RemoveHostEvent indicates that a host has been removed from the graph.
 * Removing a host necessarily implies the removal of all of the host's nodes,
 * but the node removal is treated as separate events and will be dispatched
 * separately.
 * 
 * @constructor
 * @param {String} host The host that was removed.
 * @param {Node} head The head node of the host that was removed
 */
function RemoveHostEvent(host, head) {
    this.host = host;
    this.head = head;
}

/**
 * Returns the host that was hidden that corresponds to the event.
 * 
 * @returns {String} The host that was hidden
 */
RemoveHostEvent.prototype.getHost = function() {
    return this.host;
};

/**
 * Returns the head of the host that was hidden that corresponds to the event.
 * 
 * @returns {Node} The head of the host that was hidden
 */
RemoveHostEvent.prototype.getHead = function() {
    return this.head;
};

/**
 * ChangeEvent indicates that the graph has changed in any way. This event is
 * never dispatched directly rather, dispatching any event will automatically
 * dispach a ChangeEvent.
 * 
 * @constructor
 */
function ChangeEvent() {

}