/**
 * @classdesc
 * 
 * An AbstractGraph contains the hosts and {@link AbstractNode}s that makes up the model.
 * 
 * An AbstractGraph can be thought of as a set of augmented linked-lists. Each host is
 * associated with a linked-list that is "augmented" in the sense that nodes can
 * also be connected to nodes in other linked lists. The first and last nodes in
 * each linked list are dummy head and tail nodes respectively.
 * 
 * Traversing an AbstractGraph is much like traversing a linked list. For example, to
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
 * The AbstractGraph class makes the following guarantees about nodes in the graph:
 * <li>node.getNext() == null if and only if node.isTail() == true</li>
 * <li>node.getPrev() == null if and only if node.isHead() == true</li>
 * 
 * AbstractGraph implements the observer pattern. AbstractGraph will notify registered observers
 * when certain events happen such as the removal of a node, the addition of
 * edges between nodes, removal of a host, etc
 *
 * @constructor
 * @abstract
 * @param {Array<LogEvent>} logEvents an array of log events extracted from the raw
 *        log input
 */
function AbstractGraph() {
    
    if(this.constructor == AbstractGraph) {
        throw new Exception("Cannot instantiate AbstractGraph; AbstractGraph is an abstract class");
    }
    
    /** @private */
    this.hosts = [];

    // Dictionaries linking the host name to the head/tail node for that host
    /** @private */
    this.hostToHead = {};

    /** @private */
    this.hostToTail = {};

    /** @private */
    this.observers = {};

    for (var i = 0; i < AbstractGraph.validEvents.length; i++) {
        this.observers[AbstractGraph.validEvents[i]] = {};
    }
}

/**
 * Define valid events here.
 * 
 * @static
 * @private
 */
AbstractGraph.validEvents = [ AddNodeEvent, RemoveNodeEvent, AddFamilyEvent, RemoveFamilyEvent, RemoveHostEvent, ChangeEvent ];

/**
 * Gets the dummy head node for a host.
 * 
 * @param {String} host the name of the host
 * @return {AbstractNode} the head node, or null if none is found
 */
AbstractGraph.prototype.getHead = function(host) {
    if (!this.hostToHead[host]) {
        return null;
    }
    return this.hostToHead[host];
};

/**
 * Gets the dummy tail node for a host
 * 
 * @param {String} host the name of the host
 * @return {AbstractNode} the tail node, or null if none is found
 */
AbstractGraph.prototype.getTail = function(host) {
    if (!this.hostToTail[host]) {
        return null;
    }
    return this.hostToTail[host];
};

/**
 * Gets the hosts as an array
 * 
 * @return {Array<String>} a copy of the array of host names
 */
AbstractGraph.prototype.getHosts = function() {
    return this.hosts.slice(0);
};

/**
 * Checks if this graph has the specified host
 * 
 * @param {String} host The host to check for
 * @returns {Boolean} True if the host exists
 */
AbstractGraph.prototype.hasHost = function(host) {
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
AbstractGraph.prototype.removeHost = function(host) {
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
 * @return {Array<AbstractNode>} an array of all non-dummy nodes
 */
AbstractGraph.prototype.getNodes = function() {
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
 * @return {Array<AbstractNode>} an array of all dummy nodes
 */
AbstractGraph.prototype.getDummyNodes = function() {
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
 * @return {Array<AbstractNode>} an array of all nodes in the model
 */
AbstractGraph.prototype.getAllNodes = function() {
    return this.getNodes().concat(this.getDummyNodes());
};

/**
 * Returns the non-dummy nodes of the graph in topologically sorted order. A
 * topologically sorted order is one where, for all i and j such that j > i,
 * there does not exist a directed edge from nodes[j] to nodes[i]. 
 * 
 * In the case that there are multiple permissible orderings, this method makes
 * not guarentees about which one will be returned. This method may not even return
 * the same order each time it's called.
 * 
 * @returns {Array<AbstractNode>} the nodes in topologically sorted order.
 * @throws An exception if the graph contains a cycle. There cannot exist a topologically
 * sorted order if there exists a cycle.
 */
AbstractGraph.prototype.getNodesTopologicallySorted = function() {
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
            throw new Exception("AbstractGraph.prototype.getNodesTopologicallySorted: Cannot perform topological sort - graph is not acyclic");
        }
    }

    return toposort;
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
 *        observe {@link AddNodeEvent}s, type would just be "AddNodeEvent".
 * @param {Object} context This object will be provided to the callback function
 *        when it is invoked.
 * @param {Function} callback The callback function. The parameters of the
 *        callback should be event, context
 */
AbstractGraph.prototype.addObserver = function(type, context, callback) {
    if (AbstractGraph.validEvents.indexOf(type) < 0) {
        throw new Exception("AbstractGraph.prototype.addObserver: " + type + " is not a valid event");
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
 *        remove an observer for {@link AbstractGraph}s, type would just be
 *        "AddNodeEvent".
 * @param {Function} callback The callback function.
 */
AbstractGraph.prototype.removeObserver = function(type, callback) {
    if (AbstractGraph.validEvents.indexOf(type) < 0) {
        throw new Exception("AbstractGraph.prototype.removeObserver: " + type + " is not a valid event");
    }

    delete this.observers[type][callback];
};

/**
 * Notifies all registered observers of an event. Dispatching any event will
 * also dispatch a {@link ChangeEvent}. Note that you cannot directly dispatch a
 * {@link ChangeEvent}.
 * 
 * You should only notify observers of events after the corresponding action has
 * been completed. For example, a {@link RemoveNodeEvent} should only be dispatched
 * after the node has been removed from the graph and the prev and next nodes of
 * the removed node have been linked.
 * 
 * @private
 * @param {Event} event The event object to dispatch.
 */
AbstractGraph.prototype.notify = function(event) {
    if (AbstractGraph.validEvents.indexOf(event.constructor) < 0) {
        throw new Exception("AbstractGraph.prototype.notify: " + type + " is not a valid event");
    }

    if (event.constructor == ChangeEvent) {
        throw new Exception("AbstractGraph.prototype.notify: You cannot directly dispatch a ChangeEvent.");
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
 * an event. For example, an {@link AddNodeEvent} indicates that a new node has been
 * added to the graph.
 */

/**
 * {@link AddNodeEvent}s indicate that a new node has been added to the graph. This also
 * implies that prev/next edges of the prev and next nodes of the new node have
 * been change accordingly to accomodate the new node.
 * 
 * @constructor
 * @extends Event
 * @param {AbstractNode} newNode The new node that has been added
 * @param {AbstractNode} prev newNode's previous node
 * @param {AbstractNode} next newNode's next node
 */
function AddNodeEvent(newNode, prev, next) {
    
    /** @private */
    this.newNode = newNode;
    
    /** @private */
    this.prev = prev;
    
    /** @private */
    this.next = next;
};

/**
 * Returns the newly added node that corresponds to the event.
 * 
 * @returns {AbstractNode} the newly added node.
 */
AddNodeEvent.prototype.getNewNode = function() {
    return this.newNode;
};

/**
 * Returns the previous node of the newly added node that corresponds to the
 * event.
 * 
 * @returns {AbstractNode} the prev node.
 */
AddNodeEvent.prototype.getPrev = function() {
    return this.prev;
};

/**
 * Returns the next node of the newly added node that corresponds to the event.
 * 
 * @returns {AbstractNode} the next node.
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
 * @extends Event
 * @param {AbstractNode} removedNode The new node that has been removed
 * @param {AbstractNode} prev newNode's previous node
 * @param {AbstractNode} next newNode's next node
 */
function RemoveNodeEvent(removedNode, prev, next) {
    
    /** @private */
    this.removedNode = removedNode;
    
    /** @private */
    this.prev = prev;
    
    /** @private */
    this.next = next;
};

/**
 * Returns the removed node that corresponds to the event.
 * 
 * @returns {AbstractNode} the removed node.
 */
RemoveNodeEvent.prototype.getRemovedNode = function() {
    return this.removedNode;
};

/**
 * Returns the previous node of the removed node that corresponds to the event.
 * 
 * @returns {AbstractNode} the prev node.
 */
RemoveNodeEvent.prototype.getPrev = function() {
    return this.prev;
};

/**
 * Returns the next node of the removed node that corresponds to the event.
 * 
 * @returns {AbstractNode} the next node.
 */
RemoveNodeEvent.prototype.getNext = function() {
    return this.next;
};

/**
 * AddFamilyEvent indicates that a new family relationship has been created
 * between two nodes
 * 
 * @constructor
 * @extends Event
 * @param {AbstractNode} parent The parent node in the newly created family relationship
 *        (i.e the node that gained a new child)
 * @param {AbstractNode} child The child node in the newly created family relationship
 *        (i.e the node that gained a new parent)
 */
function AddFamilyEvent(parent, child) {
    
    /** @private */
    this.parent = parent;
    
    /** @private */
    this.child = child;
}

/**
 * Returns the parent node in the newly created family relationship that
 * corresponds to the event.
 * 
 * @returns {AbstractNode} The parent node
 */
AddFamilyEvent.prototype.getParent = function() {
    return this.parent;
};

/**
 * Returns the child node in the newly created family relationship that
 * corresponds to the event.
 * 
 * @returns {AbstractNode} The child node
 */
AddFamilyEvent.prototype.getChild = function() {
    return this.child;
};

/**
 * RemoveFamilyEvent indicates that a family relationship has been removed
 * between two nodes
 * 
 * @constructor
 * @extends Event
 * @param {AbstractNode} parent The parent node in the removed family relationship (i.e
 *        the node that lost a new child)
 * @param {AbstractNode} child The child node in the removed family relationship (i.e
 *        the node that lost a new parent)
 */
function RemoveFamilyEvent(parent, child) {
    
    /** @private */
    this.parent = parent;
    
    /** @private */
    this.child = child;
}

/**
 * Returns the parent node in the removed family relationship that corresponds
 * to the event.
 * 
 * @returns {AbstractNode} The parent node
 */
RemoveFamilyEvent.prototype.getParent = function() {
    return this.parent;
};

/**
 * Returns the child node in the removed family relationship that corresponds to
 * the event.
 * 
 * @returns {AbstractNode} The child node
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
 * @extends Event
 * @param {String} host The host that was removed.
 * @param {AbstractNode} head The head node of the host that was removed
 */
function RemoveHostEvent(host, head) {
    
    /** @private */
    this.host = host;
    
    /** @private */
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
 * @returns {AbstractNode} The head of the host that was hidden
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