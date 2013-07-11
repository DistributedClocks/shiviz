/**
 * Node class
 */
function Node(log, hostId, clock, line) {
  this.log = log;
  this.hostId = hostId;
  this.clock = clock;
  this.time = clock[hostId];
  this.index = -1;

  this.parents = {};
  this.children = {};

  this.syntheticParents = {};
  this.syntheticChildren = {};
 
  this.line = line || 0;

/*
  this.collapsible = false;
  this.collapsedTarget = null;
  this.collapsedChildren = [];
  this.collapsedParent = null;
  this.collapseToggleOn = true;*/
}

Node.prototype.getLine = function() {
  return this.line;
}

Node.prototype.id = function() {
  return this.hostId + ":" + this.time;
}

Node.prototype.getClock = function() {
  return this.clock;
}

Node.prototype.getHostId = function() {
  return this.hostId;
}

Node.prototype.getTime = function() {
  return this.time;
}

Node.prototype.getLog = function() {
  return this.log;
}

Node.prototype.setIndex = function(index) {
  this.index = index;
}

Node.prototype.getIndex = function() {
  return this.index;
}

Node.prototype.addChild = function(child) {
  this.children[child.getHostId()] = child;
}

Node.prototype.addParent = function(p) {
  this.parents[p.getHostId()] = p;
}

Node.prototype.getChildren = function() {
  return this.children;
}

Node.prototype.getParents = function() {
  return this.parents;
}

Node.prototype.addSynChild = function(child) {
  var host = child.getHostId();
  if (!this.syntheticChildren.hasOwnProperty(host) ||
      this.syntheticChildren[host].getTime() > child.getTime()) {
    this.syntheticChildren[host] = child;
  }
}

Node.prototype.addSynParent = function(p) {
  var host = p.getHostId();
  if (!this.syntheticParents.hasOwnProperty(host) ||
      this.syntheticParents[host].getTime() < p.getTime()) {
    this.syntheticParents[host] = p;
  }
}

Node.prototype.getSynChildren = function() {
  return this.syntheticChildren;
}

Node.prototype.getSynParents = function() {
  return this.syntheticParents;
}

Node.prototype.clearLayoutState = function() {
  this.syntheticChildren = {};
  for (var host in this.children) {
    this.syntheticChildren[host] = this.children[host];
  }
  this.syntheticParents = {};
  for (var host in this.parents) {
    this.syntheticParents[host] = this.parents[host];
  }

  this.index = -1;
}
/*
Node.prototype.getCollapsedTarget = function() {
  return this.collapsedTarget;
}

Node.prototype.isCollapsed = function() {
  return this.collapsible && this.collapseToggleOn;
}

Node.prototype.addCollapsedChild = function(child, target) {
  if (this.collapsible) {
    this.collapsedParent.addCollapsedChild(child, target);
  } else {
    this.collapsedChildren.push(child);
    this.collapsedTarget = target;
  }
}

Node.prototype.getCollapsedChildren = function() {
  return this.collapsedChildren;
}

Node.prototype.assignCollapsible = function(nodes) {
  if (this.getTime() <= 1) {
    this.collapsible = false;
    return;
  }

  for (var p in this.parents) {
    if (p != this.getHostId()) {
      this.collapsible = false;
      return;
    }
  }
  
  for (var c in this.children) {
    if (c != this.getHostId()) {
      this.collapsible = false;
      return;
    }
  }

  // Yes collapsible!
  this.collapsedParent = this.parents[this.hostId];
  var c = null;
  if (this.children.hasOwnProperty(this.hostId)) {
    c = this.children[this.hostId];
  }
  this.collapsedParent.addCollapsedChild(this, c);

  this.collapsible = true;
}*/

