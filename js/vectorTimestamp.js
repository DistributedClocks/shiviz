function VectorTimestamp(clock, host) {
  this.clock = clock;
  this.host = host;
  this.ownTime = clock[host];
}

VectorTimestamp.prototype.compareTo = function(other) {
  // check if this happens before other
  var thisFirst = false;
  for(var host in this.clock) {
    if(other.clock[host] != undefined && this.clock[host] < other.clock[host]) {
      thisFirst = true;
      break;
    }
  }
  
  // check if other happens before this
  var otherFirst = false;
  for(var host in other.clock) {
    if(this.clock[host] != undefined && other.clock[host] < this.clock[host]) {
      otherFirst = true;
      break;
    }
  }
  
  // return the correct value
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

VectorTimestamp.prototype.compareToLocal = function(other) {
  if(this.host != other.host) {
    return 0;
  }
  
  return this.clock[this.host] - other.clock[other.host];
}