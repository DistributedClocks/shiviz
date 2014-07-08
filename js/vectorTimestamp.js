/**
 * A Vector Timestamp
 */

/**
 * @constructor
 * @param {{String: Number}} clock The vector clock with host names
 *        corresponding to timestamps for host
 * @param {String} host The host the timestamp belongs to
 * @throws {String} An error string if the vector clock does not contain an
 *         entry for the host
 */
function VectorTimestamp(clock, host) {
    /** @private */
    this.clock = clock;

    /** @private */
    this.host = host;

    /** @private */
    this.ownTime = clock[this.host];

    if (!clock.hasOwnProperty(host)) {
        throw "Vector timestamp error: Vector clock must contain entry for host";
    }

    for (var host in clock) {
        if (clock[host] == 0) {
            delete clock[host];
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

VectorTimestamp.prototype.increment = function() {
    var clock = {};
    for (var key in this.clock) {
        clock[key] = this.clock[key];
    }
    clock[this.host]++;
    return new VectorTimestamp(clock, this.host);
};

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

    return true;
};

/**
 * Compares two vector timestamp.
 * 
 * Returns a negative number if this timestamp happens before other. Returns a
 * positive number if other timestamp happens before this. Returns zero if both
 * are concurrent or equal.
 * 
 * Let x[host] be the logical clock value for host in vector clock x. A vector
 * timestamp x is said to happen before y if for all hosts, x[host] <= y[host]
 * AND there exists at least one host h such that x[h] < y[h]. x and y are said
 * to be concurrent if x does not happen before y AND y does not happen before x
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @return {Number} the result of the comparison as defined above
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
 * Compare two timestamps based on their local times only.
 * 
 * If this timestamp happens before the other, return
 * 
 * Returns zero if this.host is not equal to other.host. Returns a negative
 * number if this happens before other. Returns a positive number is other
 * happens before this.
 * 
 * A vector clock x is said to happen before y if they have the same host and
 * x[host] < y[host]
 * 
 * @param {VectorTimestamp} other the timestamp to compare to
 * @return {Number} the result of the comparison as defined above
 */
VectorTimestamp.prototype.compareToLocal = function(other) {
    if (this.host != other.host) {
        return 0;
    }

    return this.clock[this.host] - other.clock[other.host];
};