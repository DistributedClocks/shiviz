/**
  * Constructs a motifDrawer
  *
  * @classdesc
  *
  *
  *
  * @constructor
  */

function MotifDrawer(global, viewToCount, builderGraphs) {

	/* @private */
	this.global = global;

	/* @private */
	this.viewToCount = viewToCount;

	/* @private */
	this.builderGraphs = builderGraphs;

	/* @private */
	this.table = $("<td></td>");
}

MotifDrawer.prototype.drawResults = function() {
	this.clearResults();
	var table = this.table;
	var viewToCount = this.viewToCount;

	var results = this.calculateMotifs();
	var motifToViews = results.motifToViews;
	var motifs = results.motifs;

	for (var index = 0; index < motifs.length; index++) {
		var motifIndex = motifs[index];

		// Draw the motif
        var motifSVG = $("<svg width='50' height='50'></svg>")
        table.append($("<p></p>").text("Motif " + motifIndex + " :"), "<br>", motifSVG, "<br>");
        var graphBuilder = new GraphBuilder(motifSVG, null, true);
		graphBuilder.convertFromBG(this.builderGraphs[motifIndex]);

		// List the executions that contain this motif
		var views = motifToViews[motifIndex];
		views.forEach(function(view) {
			var count = viewToCount[view][motifIndex];
			table.append($("<a></a>").text(view + " : "), $("<span></span>").text(count), "<br>");
		});
	}
	$(".motifResults").append(table);
}

/**
 * Calculates significance of subgraphs and creates a mapping from motif to views containing that motif
 */ 
MotifDrawer.prototype.calculateMotifs = function() {
   	var views = this.global.getViews();
    var viewToCount = this.viewToCount;

    // Get the number of motifs that are read in from motifs.json
    var numMotifs = viewToCount[views[0].getLabel()].length;
    var motifToViews = {};
    var motifs = [];

    views.forEach(function(view) {
        var label = view.getLabel();
        var motifsCount = viewToCount[label];

        // Iterate through the count for each motif for this view
        for (var index=0; index < numMotifs; index++) {
            // If this view has this motif, add its label to the array
            if (motifsCount[index] > 0) {
                if (motifToViews[index]) {
                    motifToViews[index].push(label);
                } else {
                    motifToViews[index] = [label];
                }
                // within-execution significance
                if (motifsCount[index] > 5 && motifs.indexOf(index) < 0) {
                	motifs.push(index);
                }
            }
        }
    });
    
    // across-execution significance
    for (var index=0; index < numMotifs; index++) {

    	// If more than 50% of the executions have this subgraph, count it as a motif
    	// Note that if motifToViews[index] doesn't exist, then no executions contain the subgraph at this index
    	if (motifToViews[index]) {
    		if ((motifToViews[index].length > (Math.ceil((views.length)/2))) && (motifs.indexOf(index) < 0)) {
    			motifs.push(index);
    		}
    	}
    }

    return {
    	motifs: motifs,
    	motifToViews: motifToViews
    };
}

/**
 * Clears the results table
 */
MotifDrawer.prototype.clearResults = function() {
	$(".motifResults td").empty();
	$(".motifResults td:empty").remove();
}