function MotifNavigator() {


    this.motifDatas = [];

    this.index = -1;
    
    this.wrap = true;
    
    this.hasStarted = false;

};

MotifNavigator.prototype.addMotif = function(visualGraph, motifGroup) {
    
    if(this.hasStarted) {
        throw new Exception(); //TODO
    }
    
    var motifs = motifGroup.getMotifs();
    for(var m = 0; m < motifs.length; m++) {
        var motif = motifs[m];
        var minValue = Number.POSITIVE_INFINITY;

        var nodes = motif.getNodes();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var visualNode = this.visualGraph.getVisualNodeByNode(node);
            minValue = Math.min(minValue, visualNode.getY());
        }
        
        this.motifDatas.push({
            y: minValue
        });
    }

};

MotifNavigator.prototype.start = function() {
    this.motifDatas.sort(function(a, b) {
        return a.y - b.y;
    });
    
    this.hasStarted = true;
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