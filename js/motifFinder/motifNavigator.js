function MotifNavigator(global) {

    this.global = global;

    /** @private */
    this.motifDatas = [];

    /** @private */
    this.index = -1;
    
    /** @private */
    this.wrap = true;
    
    /** @private */
    this.hasStarted = false;

};

MotifNavigator.TOP_SPACING = 100;

MotifNavigator.prototype.addMotif = function(visualGraph, motifGroup) {
    
    if(this.hasStarted) {
        throw new Exception(); //TODO
    }
    
    var motifs = motifGroup.getMotifs();
    for(var m = 0; m < motifs.length; m++) {
        var motif = motifs[m];
        var top = Number.POSITIVE_INFINITY;
        var bottom = Number.NEGATIVE_INFINITY;
        var left = Number.POSITIVE_INFINITY;
        var right = Number.NEGATIVE_INFINITY;

        var nodes = motif.getNodes();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var visualNode = visualGraph.getVisualNodeByNode(node);
            top = Math.min(top, visualNode.getY());
            bottom = Math.max(bottom, visualNode.getY());
            left = Math.min(left, visualNode.getX());
            right = Math.max(right, visualNode.getX());
        }
        
        this.motifDatas.push({
            top: top,
            bottom: bottom,
            left: left,
            right: right,
            motif: motif,
            visualGraph: visualGraph
        });
    }

};

MotifNavigator.prototype.setWrap = function(wrap) {
    this.wrap = wrap;
};

MotifNavigator.prototype.start = function() {
    this.motifDatas.sort(function(a, b) {
        return a.top - b.top;
    });
    
    this.hasStarted = true;
};

MotifNavigator.prototype.getNumMotifs = function() {
    return this.motifDatas.length;
};

MotifNavigator.prototype.next = function() {

    this.index++;
    if(this.index >= this.getNumMotifs()) {
        this.index = this.wrap ? 0 : this.getNumMotifs();
    }
    
    this.handleCurrent();
};

MotifNavigator.prototype.prev = function() {
    
    this.index--;

    if(this.index < 0) {
        this.index = this.wrap ? this.getNumMotifs() - 1 : -1;
    }
    
    this.handleCurrent();
};

/**
 * @private
 */
MotifNavigator.prototype.handleCurrent = function() {
    if(this.index >= this.getNumMotifs() || this.index < 0) {
        return;
    }
    
    var motifData = this.motifDatas[this.index];
    
    var position = motifData.top - MotifNavigator.TOP_SPACING;
    position = Math.max(0, position);
    $(window).scrollTop(position);

    this.global.drawBox(motifData);
    
//    var motif = motifData.motif;
//    var visualGraph = motifData.visualGraph;
//    
//    motif.getNodes().forEach(function(node) {
//       visualGraph.getVisualNodeByNode(node).setRadius(20);
//    });
};