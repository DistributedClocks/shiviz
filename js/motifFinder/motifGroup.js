function MotifGroup(motifs) {
    
    this.motifs = motifs || [];
    
}


//TODO: prune empty motifs
MotifGroup.prototype.addMotif = function(motif) {
    this.motifs.push(motif);
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