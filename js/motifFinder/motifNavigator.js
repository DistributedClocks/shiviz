function MotifNavigator(callback, data) {

    /** @private */
    this.motifDatas = [];

    /** @private */
    this.index = -1;
    
    /** @private */
    this.wrap = true;
    
    /** @private */
    this.hasStarted = false;
    
    /** @private */
    this.callback = callback;
    
    /** @private */
    this.data = data;

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

        var nodes = motif.getNodes();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var visualNode = visualGraph.getVisualNodeByNode(node);
            top = Math.min(top, visualNode.getY());
        }
        
        var data = new MotifDataNavigatorData(top, motif, visualGraph);
        this.motifDatas.push(data);
    }

};

MotifNavigator.prototype.setWrap = function(wrap) {
    this.wrap = wrap;
};

MotifNavigator.prototype.start = function() {
    this.motifDatas.sort(function(a, b) {
        return a.getTop() - b.getTop();
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
    
    var position = motifData.getTop() - MotifNavigator.TOP_SPACING;
    position = Math.max(0, position);
    $(window).scrollTop(position);
    this.callback(motifData, this.data);
};


function MotifDataNavigatorData(top, motif, visualGraph) {
    
    /** @private */
    this.top = top;
    
    /** @private */
    this.motif = motif;
    
    /** @private */
    this.visualGraph = visualGraph;
}

MotifDataNavigatorData.prototype.getTop = function() {
    return this.top;
};

MotifDataNavigatorData.prototype.getMotif = function() {
    return this.motif;
};

MotifDataNavigatorData.prototype.getVisualGraph = function() {
    return this.visualGraph;
};