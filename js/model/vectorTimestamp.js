/**
 * Constructs a VectorTimestamp with the provided clock and host.
 * 
 * @classdesc
 * 
 * A VectorTimestamp is a timestamp used according to the
 * {@link http://en.wikipedia.org/wiki/Vector_clock Vector Clock Algorithm} It
 * is so named because it contains a vector of numerical clock values for
 * different hosts. VectorTimestamps are immutable.
 * 
 * @see {@link http://en.wikipedia.org/wiki/Vector_clock Wikipedian explanation of the Vector Clock algorithm}
 * @constructor
 * @param {Object<String, Number>} clock The vector clock with host names
 *            corresponding to timestamps for host
 * @param {String} host The host the timestamp belongs to
 * @throws {String} An error string if the vector clock does not contain an
 *             entry for the host
 */
function VectorTimestamp(clock, host) {
    /** @private */
    this.clock = Util.objectShallowCopy(clock);

    /** @private */
    this.host = host;

    /** @private */
    this.ownTime = clock[this.host];

    if (!clock.hasOwnProperty(host)) {
        var exp = new Exception("Local host \"" + host + "\" is missing from timestamp:");
        throw exp;
    }

    for (var host in this.clock) {
        if (this.clock[host] == 0) {
            delete this.clock[host];
        }
    }
}

/**
 * Returns the host name of the host this vector timestamp belongs to
 * 
 * @returns {String} The host name
 */
VectorTimestamp.prototype.getOwnHost = function() {
    return this.host;
};

/**
 * Returns the clock value of the host
 * 
 * @returns {Number} The clock value
 */
VectorTimestamp.prototype.getOwnTime = function() {
    return this.ownTime;
};

/**
 * Returns the entire vector clock as a JSON object
 * 
 * @returns {Object} the clock
 */
VectorTimestamp.prototype.getClock = function() {
    var clock = {};
    for(var key in this.clock) {
        clock[key] = this.clock[key];
    }
    return clock;
};

/**
 * <p>
 * Returns a vector timestamp that is this updated with the argument. The
 * timestamp updating is done according to the
 * {@link http://en.wikipedia.org/wiki/Vector_clock Vector Clock algorithm}.
 * That is, for each key in the set of all keys, newVT.clock[key] =
 * max(this.clock[key], other.clock[key]). The host of the returned timestamp is
 * the same as the host of this.
 * </p>
 * 
 * <p>
 * Note that the returned timestamp is the updated timestamp. Neither this nor
 * the argument timestamp is modified in any way, as VectorTimestamps are
 * immutable
 * </p>
 * 
 * @see {@link http://en.wikipedia.org/wiki/Vector_clock Wikipedian explanation of the Vector Clock algorithm}
 * @param {VectorTimestamp} other The other timestamp used to update the current
 *            one
 * @returns {VectorTimestamp} The updated vector timestamp.
 */
VectorTimestamp.prototype.update = function(other) {
    var clock = {};
    for (var key in this.clock) {
        clock[key] = this.clock[key];
    }

    for (var key in other.clock) {
        if (!clock.hasOwnProperty(key)) {
            clock[key] = other.clock[key];
        }
        clock[key] = Math.max(clock[key], other.clock[key]);
    }
    return new VectorTimestamp(clock, this.host);
};

/**
 * <p>
 * Gets the vector timestamp that is identical to this current one, except its
 * own hosts clock has been incremented by one.
 * </p>
 * 
 * <p>
 * Note that this method does not modify this, as VectorTimestamps are
 * immutable.
 * </p>
 * 
 * @returns {VectorTimestamp} A vector timestamp identical to this, except with
 *          its own host's clock incremented by one
 */
VectorTimestamp.prototype.increment = function() {
    var clock = {};
    for (var key in this.clock) {
        clock[key] = this.clock[key];
    }
    clock[this.host]++;
    return new VectorTimestamp(clock, this.host);
};

/**
 * <p>
 * Checks if this VectorTimestamp is equal to another. Two vector timestamps are
 * considered equal if they have they exact same host and the exact same
 * key-value pairs.
 * </p>
 * 
 * @param {VectorTimestamp} other The other VectorTimestamp to compare against
 * @returns {Boolean} True if this equals other
 */
VectorTimestamp.prototype.equals = function(other) {
    for (var key in this.clock) {
        if (this.clock[key] != other.clock[key]) {
            return false;
        }
    }

    for (var key in other.clock) {
        if (other.clock[key] != this.clock[key]) {
            return false;
        }
    }

    return this.host == other.host;
};

/**
 * <p>
 * Compares two vector timestamp.
 * </p>
 * 
 * <p>
 * Returns a negative number if this timestamp happens before other. Returns a
 * positive number if other timestamp happens before this. Returns zero if both
 * are concurrent or equal.
 * </p>
 * 
 * <p>
 * Let x[host] be the logical clock value for host in vector clock x. A vector
 * timestamp x is said to happen before y if for all hosts, x[host] <= y[host]
 * AND there exists at least one host h such that x[h] < y[h]. x and y are said
 * to be concurrent if x does not happen before y AND y does not happen before x
 * </p>
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @returns {Number} the result of the comparison as defined above
 */
VectorTimestamp.prototype.compareTo = function(other) {
    var thisFirst = false;
    for (var host in this.clock) {
        if (other.clock[host] != undefined && this.clock[host] < other.clock[host]) {
            thisFirst = true;
            break;
        }
    }

    var otherFirst = false;
    for (var host in other.clock) {
        if (this.clock[host] != undefined && other.clock[host] < this.clock[host]) {
            otherFirst = true;
            break;
        }
    }

    if (thisFirst && !otherFirst) {
        return -1;
    }
    if (otherFirst && !thisFirst) {
        return 1;
    }
    return 0;
};

/**
 * <p>
 * Compare two timestamps based on their local times only.
 * </p>
 * 
 * <p>
 * Returns zero if this.host is not equal to other.host. Returns a negative
 * number if this happens before other. Returns a positive number is other
 * happens before this.
 * </p>
 * 
 * <p>
 * A vector clock x is said to happen before y if they have the same host and
 * x[host] < y[host]
 * </p>
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @returns {Number} the result of the comparison as defined above
 */
VectorTimestamp.prototype.compareToLocal = function(other) {
    if (this.host != other.host) {
        return 0;
    }

    return this.clock[this.host] - other.clock[other.host];
};