/**
 * A vector timestamp
 * @param {{String: Number}} clock the vector clock with
 *                                 host names corresponding
 *                                 to timestamps for host
 * @param {String}           host  the host the timestamp
 *                                 belongs to
 */
function VectorTimestamp(clock, host) {
  this.clock = clock;
  this.host = host;
  this.ownTime = clock[host];
}

/**
 * Compares two vector timestamps.
 * If this timestamp precedes other, return -1
 * If the other timestamp precedes this, return 1
 * If they are equal, return 0
 * If they are concurrent, return null
 * @param  {VectorTimestamp} other the timestamp to compare to
 * @return {Number}                the result of the comparison 
 */
VectorTimestamp.prototype.compareTo = function(other) {
  // Check if this happens before other
  var thisFirst = false;
  for(var host in this.clock) {
    if(other.clock[host] != undefined && this.clock[host] < other.clock[host]) {
      thisFirst = true;
      break;
    }
  }
  
  // Check if other happens before this
  var otherFirst = false;
  for(var host in other.clock) {
    if(this.clock[host] != undefined && other.clock[host] < this.clock[host]) {
      otherFirst = true;
      break;
    }
  }
  
  // Return the correct value
  if(thisFirst && otherFirst) {
    return null;
  }
  if(thisFirst) {
    return -1;
  }
  if(otherFirst) {
    return 1;
  }
  return 0;
};

/**
 * Compare two timestamps from the same host.
 * If the hosts are not equal, return 0.
 * If this timestamp precedes the other, return negative
 * If the other timestamp precedes this, return positive
 * @param  {VectorTimestamp} other the timestamp to compare to
 * @return {Number}                the result
 */
VectorTimestamp.prototype.compareToLocal = function(other) {
  if(this.host != other.host) {
    return 0;
  }
  
  return this.clock[this.host] - other.clock[other.host];
}