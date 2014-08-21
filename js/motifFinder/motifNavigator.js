function MotifNavigator(visualGraph, motifGroup) {

    this.visualGraph = visualGraph;

    this.motifDatas = motifGroup.getMotifs().map(function(motif) {
        var minValue = Number.POSITIVE_INFINITY;

        var nodes = motif.getNodes();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var visualNode = this.visualGraph.getVisualNodeByNode(node);
            minValue = Math.min(minValue, visualNode.getY());
        }

        return {
            y: minValue
        };
    }).sort(function(a, b) {
        return a.y - b.y;
    });

    this.index = -1;
    
    this.wrap = true;

};

MotifNavigator.prototype.getNumMotifs = function() {
    return this.motifDatas.length;
};

MotifNavigator.prototype.next = function() {

    this.index++;

    if(this.index > this.getNumMotifs()) {
        this.index = this.wrap ? 0 : this.getNumMotifs();
    }
};

MotifNavigator.prototype.prev = function() {
    
    this.index--;

    if(this.index < 0) {
        this.index = this.wrap ? this.getNumMotifs() - 1 : -1;
    }
};