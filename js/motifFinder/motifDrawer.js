/**
  * Constructs a motifDrawer
  *
  * @classdesc
  *
  * A MotifDrawer is responsible for calculating the significance of subgraphs read in from motifs.json, drawing
  * resulting motifs and listing corresponding views in the motifs tab. It uses the builderGraphs created during
  * reading of motifs.json to generate graphBuilders for drawing the motifs.
  *
  * @constructor
  */

function MotifDrawer(viewToCount, builderGraphs) {

    /* @private */
    this.searchbar = SearchBar.getInstance();

    /* @private */
    this.global = this.searchbar.getGlobal();

    /* @private */
    this.viewToCount = viewToCount;

    /* @private */
    this.builderGraphs = builderGraphs;

    /* @private */
    this.table = $("<td></td>");
}

/**
 * Draws the motifs calculated by calculateMotifs() and lists the corresponding execution labels beside the graph
 */
MotifDrawer.prototype.drawResults = function() {
    this.clearResults();

    var context = this;
    var results = this.calculateMotifs();
    var motifToViews = results.motifToViews;
    var motifs = this.sortMotifs(results.motifs);

    for (var index = 0; index < motifs.length; index++) {
        var motifIndex = motifs[index];
        var motifNum = index + 1;

        // Draw the motif
        var motifSVG = $("<svg width='0' height='0'></svg>")
        this.table.append($("<p></p>").text("Motif " + motifNum + " :"), "<br>", motifSVG, "<br>");
        var graphBuilder = new GraphBuilder(motifSVG, null, true);
        graphBuilder.convertFromBG(this.builderGraphs[motifIndex]);

        // Set the dimensions of the svg depending on the size of the motif
        var svgWidth = graphBuilder.getMaxNodeWidth() + 25;
        var svgHeight = graphBuilder.getMaxNodeHeight() + 25;
        motifSVG.css({"width": svgWidth, "height": svgHeight});

        // List the executions that contain this motif in sorted order
        var viewLabels = this.sortLabels(motifToViews[motifIndex], motifIndex);

        viewLabels.forEach(function(viewLabel) {
            var count = parseInt(context.viewToCount[viewLabel][motifIndex]);
            var numInstances = ": " + count + " instance";
            if (count > 1) {
                numInstances = numInstances.concat("s");
            }
            if (viewLabel == "") {
                // For a single execution where the label is "", just list the number of instances
                context.table.append($("<a></a>").text(numInstances.substring(2)).attr("href", motifIndex));
            } else {
                // For multiple executions, list the execution label along with the number of instances
                context.table.append($("<a></a>").text(viewLabel).attr("href", motifIndex), 
                    $("<span></span>").text(numInstances), "<br>");
            }
        });
        context.table.append("<br>");
    }
    if (context.table.find("a").length == 0) {
        context.table.append($("<p></p>").text("No motifs found"));
    }
    $(".motifResults").append(this.table);

    // Event handler when links in the motifs tab are clicked
    $(".motifResults a").on("click", function(e) {
        var motifIndex = $(this).attr("href");
        $("#motifIcon").remove();
        $(".motifResults a").removeClass("indent");

        var motifIcon = $('<label id="motifIcon"></label>').text("r");

        if (context.global.getViews().length > 1) {
            var viewLabel = $(this).text();
            context.global.setView("L", viewLabel);
        }
        // Indent the clicked on execution and any other executions under the same motif
        $(this).nextUntil("p", ":not(span)").addBack().addClass("indent");
        $(this).prevUntil("svg", ":not(span)").addClass("indent");
        $(this).before(motifIcon);

        // Clear any current searches and re-set to motif search
        if (context.searchbar.getMode() != SearchBar.MODE_MOTIF) {
            context.searchbar.clear();
            context.searchbar.setValue("#motif");
        }
        // Highlight the given motif in the clicked on execution
        context.highlightMotif(motifIndex);

        // Show the number of instances of the highlighted motif
        $("#searchbar").addClass("results");
        context.searchbar.countMotifs();

        e.preventDefault();
    });
}

/**
 * Calculates significance of subgraphs and returns an array of indices corresponding to subgraphs in motifs.json
 * that were calculated to be motifs. Also returns a mapping from motifs to views containing that motif.
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
        for (var motifIndex=0; motifIndex < numMotifs; motifIndex++) {
            // If this view has this motif, add its label to motifToViews[motifIndex]
            if (motifsCount[motifIndex] > 0) {
                if (motifToViews[motifIndex]) {
                    motifToViews[motifIndex].push(label);
                } else {
                    motifToViews[motifIndex] = [label];
                }
                // If a view has more than 5 instances of a subgraph, count it as a motif
                if (motifsCount[motifIndex] > 5 && motifs.indexOf(motifIndex) < 0) {
                    motifs.push(motifIndex);
                }
            }
        }
    });
    
    for (var motifIndex=0; motifIndex < numMotifs; motifIndex++) {
        // If more than 50% of the executions have this subgraph, count it as a motif. Note that if 
        // motifToViews[motifIndex] doesn't exist, then no executions contain the subgraph at this motifIndex
        if (motifToViews[motifIndex]) {
            if ((motifToViews[motifIndex].length > (Math.ceil((views.length)/2))) && (motifs.indexOf(motifIndex) < 0)) {
                motifs.push(motifIndex);
            }
        }
    }

    return {
        motifs: motifs,
        motifToViews: motifToViews
    };
}

/**
 * Sorts the view labels by descending number of instances of the motif at the given motifIndex
 *
 * @param {Array<String>} labels The labels for the views
 * @param {Number} motifIndex the index of the relevant motif in motifs.json
 * 
 * @returns {Array<String>} labels The sorted labels
 */
MotifDrawer.prototype.sortLabels = function(labels, motifIndex) {
    var viewToCount = this.viewToCount;
    labels.sort(function(a,b) {
        var countA = viewToCount[a][motifIndex];
        var countB = viewToCount[b][motifIndex];
        return countB - countA;
    });
    return labels;
}

/**
 * Sorts the given motifs in the order they appear in motifs.json
 *
 * @param {Array<Number>} motifs Indices of motifs
 * @returns {Array<Number>} motifs The sorted motifs
 */
MotifDrawer.prototype.sortMotifs = function(motifs) {
    motifs.sort(function(a,b) {
        return a - b;
    });
    return motifs;
}

/**
 * This function is responsible for highlighting the motif at the given motifIndex in the active views
 *
 * @param {Number} motifIndex The index of the relevant motif in motifs.json
 */
MotifDrawer.prototype.highlightMotif = function(motifIndex) {

    var controller = this.global.getController();
    var views = this.global.getActiveViews();
    var viewL = views[0];
    var viewR = views[1];

    var finder = new CustomMotifFinder(this.builderGraphs[motifIndex]);
    viewL.getTransformer().highlightMotif(finder, false);
    // Redraw the view to apply the transformation to the graph and to the log lines
    viewL.draw("L");
    controller.bindLines(viewL.getLogTable().find(".line:not(.more)"));

    if (this.global.getPairwiseView()) {
        viewR.getTransformer().highlightMotif(finder, false);
        viewR.draw("R");
        controller.bindLines(viewR.getLogTable().find(".line:not(.more)"));
    }
}

/**
 * Clears the results table
 */
MotifDrawer.prototype.clearResults = function() {
    $(".motifResults td").empty();
    $(".motifResults td:empty").remove();
}