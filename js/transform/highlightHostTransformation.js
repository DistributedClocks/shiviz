/**
 * Constructs a HighlightHostTransformation that highlights the specified host
 * 
 * @classdesc
 * 
 * <p>
 * HighlightHostTransformation "highlights" a set of hosts by removing all edges
 * not incident on the set of highlighted nodes. The highlighted hosts are drawn
 * with a border to distinguish them from unhighlighted ones.
 * </p>
 * 
 * <p>
 * In the case that the set of hosts to highlight is empty, this transformation
 * does nothing. In the case that a specified host does not exist, it is
 * ignored.
 * </p>
 * 
 * @constructor
 * @extends Transformation
 * @param {String} host The host to highlight
 */
function HighlightHostTransformation() {

    /** @private */
    this.hosts = {};

    /** @private */
    this.hiddenHosts = {};

    /** @private */
    this.hideHostTransformations = [];
}

// HighlightMotifTransformation extends Transformation
HighlightHostTransformation.prototype = Object.create(Transformation.prototype);
HighlightHostTransformation.prototype.constructor = HighlightHostTransformation;

HighlightHostTransformation.prototype.isHighlighted = function(host) {
    return !!this.hosts[host];
};

HighlightHostTransformation.prototype.isHidden = function(host) {
    return !!this.hiddenHosts[host];
};

/**
 * Gets the highlighted host(s)
 * 
 * @returns {Array<String>} A list of highlighted hosts
 */
HighlightHostTransformation.prototype.getHosts = function() {
    return Object.keys(this.hosts);
};

/**
 * Adds a host to the set of hosts to highlight.
 * 
 * @param {String} host
 */
HighlightHostTransformation.prototype.addHost = function(host) {
    this.hosts[host] = true;
};

/**
 * Removes a host from the set of hosts to highlight. In the case that the
 * provided host isn't in the set of hosts to highlight, this method does
 * nothing.
 * 
 * @param {String} host
 */
HighlightHostTransformation.prototype.removeHost = function(host) {
    delete this.hosts[host];
};

/**
 * Toggles a host to and from the set of hosts to highlight. In other words, if
 * a host is currently in the set of hosts to highlight, it is removed and if it
 * isn't in that set, it is added to that set.
 * 
 * @param {String} host
 */
HighlightHostTransformation.prototype.toggleHost = function(host) {
    if (!this.hosts[host]) {
        this.hosts[host] = true;
    }
    else {
        delete this.hosts[host];
    }
};

/**
 * Removes all hosts that are to be highlighted. No hosts will be highlighted by
 * this transformation after running this method.
 */
HighlightHostTransformation.prototype.clearHosts = function() {
    this.hosts = {};
};

/**
 * <p>
 * Gets the hosts that are hidden by the transformation.
 * </p>
 * 
 * <p>
 * When hosts are highlighted, irrelevant hosts will be hidden. This method
 * returns those implicitly hidden hosts (not the hosts that are specified to be
 * hidden). Since the hosts to be hidden are only calculated when the transform
 * method is invoked, this method will return the implicity hidden hosts from
 * the last call to transform. If transform has yet to be called, this method
 * returns an empty array.
 * </p>
 * 
 * @returns {Array<String>} The array of hosts.
 */
HighlightHostTransformation.prototype.getHiddenHosts = function() {
    return Object.keys(this.hiddenHosts);
};

/**
 * Overrides {@link Transformation#transform}
 */
HighlightHostTransformation.prototype.transform = function(model) {
    var graph = model.getGraph();
    this.hiddenHosts = {};
    this.hideHostTransformations = [];

    var numHosts = 0;
    for (var key in this.hosts) {
        numHosts++;
        var head = graph.getHead(key);
        if (head != null) {
            var vn = model.getVisualNodeByNode(head);
            vn.setHighlight(true);
        }
    }

    if (numHosts == 0) {
        return;
    }

    var hosts = graph.getHosts();
    for (var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        if (this.hosts[host]) {
            continue;
        }

        var communicated = {};
        var numCommunicated = 0;

        var curr = graph.getHead(host).getNext();
        while (!curr.isTail()) {
            var families = curr.getFamily();
            var keep = false;

            for (var j = 0; j < families.length; j++) {
                var family = families[j];
                keep |= this.hosts[family.getHost()];

                if (this.hosts[family.getHost()] && !communicated[family.getHost()]) {
                    communicated[family.getHost()] = true;
                    numCommunicated++;
                }
            }

            if (!keep) {
                model.addHiddenEdgeToFamily(curr);
                curr = curr.getPrev();
                curr.getNext().remove();
            }
            curr = curr.getNext();
        }

        if (numCommunicated != numHosts) {
            var hideHostTransformation = new HideHostTransformation(host);
            hideHostTransformation.transform(model);
            this.hideHostTransformations.push(hideHostTransformation);
            this.hiddenHosts[host] = true;
        }

    }

    model.update();
};
