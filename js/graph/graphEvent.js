/**
 * @classdesc
 * 
 * AddNodeEvents indicate that a new node has been added to the graph. This also
 * implies that prev/next edges of the prev and next nodes of the new node have
 * been change accordingly to accomodate the new node.
 * 
 * @constructor
 * @protected
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
 * @classdesc
 * 
 * RemoveNodeEvent indicates that a node has been removed from the graph. This
 * also implies that prev/next edges of the prev and next nodes of the removed
 * node have been change accordingly
 * 
 * @constructor
 * @protected
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
 * @classdesc
 * 
 * AddFamilyEvent indicates that a new family relationship has been created
 * between two nodes
 * 
 * @constructor
 * @protected
 * @extends Event
 * @param {AbstractNode} parent The parent node in the newly created family
 *            relationship (i.e the node that gained a new child)
 * @param {AbstractNode} child The child node in the newly created family
 *            relationship (i.e the node that gained a new parent)
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
 * @classdesc
 * 
 * RemoveFamilyEvent indicates that a family relationship has been removed
 * between two nodes
 * 
 * @constructor
 * @protected
 * @extends Event
 * @param {AbstractNode} parent The parent node in the removed family
 *            relationship (i.e the node that lost a new child)
 * @param {AbstractNode} child The child node in the removed family relationship
 *            (i.e the node that lost a new parent)
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
 * @classdesc
 * 
 * RemoveHostEvent indicates that a host has been removed from the graph.
 * Removing a host necessarily implies the removal of all of the host's nodes,
 * but the node removal is treated as separate events and will be dispatched
 * separately.
 * 
 * @constructor
 * @protected
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
 * @classdesc
 * 
 * ChangeEvent indicates that the graph has changed in any way. This event is
 * never dispatched directly rather, dispatching any event will automatically
 * dispach a ChangeEvent.
 * 
 * @constructor
 * @protected
 */
function ChangeEvent() {

}