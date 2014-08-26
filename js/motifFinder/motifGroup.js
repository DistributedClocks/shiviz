function MotifGroup(motifs) {
    
    this.motifs = motifs || []; //TODO: shallow copy (change other cases too)
    
}


//TODO: prune empty motifs
MotifGroup.prototype.addMotif = function(motif) {
    this.motifs.push(motif);
};

MotifGroup.prototype.addMotifGroup = function(motifGroup) {
    var motifs = motifGroup.getMotifs();
    for(var i = 0; i < motifs.length; i++) {
        this.addMotif(motifs[i]);
    }
};

MotifGroup.prototype.getMotifs = function() {
    return this.motifs.slice();
};

MotifGroup.prototype.getNodes = function() {
    var result = [];
    
    this.motifs.forEach(function(motif) {
        result = result.concat(motif.getNodes());
    });
    
    return result;
};

MotifGroup.prototype.getEdges = function() {
    var result = [];
    
    this.motifs.forEach(function(motif) {
        result = result.concat(motif.getEdges());
    });
    
    return result;
};