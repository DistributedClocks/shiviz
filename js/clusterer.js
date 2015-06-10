/**
  * Constructs a clusterer
  *
  * @classdesc
  *
  * A clusterer separates the executions in the input log into different groups
  * based on a chosen metric and displays the results in the cluster tab in the
  * left sidebar
  *
  * @constructor
  * @param {String} metric The chosen metric for clustering executions
  */

function Clusterer(metric) {

    /** @private */
    this.global = null;

    /** @private */
    this.metric = metric;

    /** @private */
    this.table = $("<td></td>");
 
}

/**
  * Sets the global associated with this Clusterer. The views that make up this global
  * will be used to determine what cluster an execution is grouped under
  *
  * @param {Global} global The global associated with the Clusterer
  */
Clusterer.prototype.setGlobal = function(global) {
    this.global = global;
};

/**
  * This function delegates clustering to the appropriate helper function based on
  * the metric that was set when the Clusterer was constructed
  */
Clusterer.prototype.cluster = function() {
    switch (this.metric) {
        case "numprocess":
            this.clusterByNumProcesses();
            break;
    }
};

/**
  * This function starts by finding the minimum and maximum number of processes
  * across all the views. If these values are the same, all executions are listed
  * under one cluster heading. Otherwise, the midpoint between max and min is
  * determined and executions with <= midpoint processes are grouped under
  * one heading and ones with > midpoint processes are grouped into another
  */
Clusterer.prototype.clusterByNumProcesses = function() {
    var context = this;
    var views = this.global.getViews();
    var numProcesses = [];

    for (var i=0; i < views.length; i++) {
        numProcesses[i] = views[i].getHosts().length;
    }
    var max = Math.max.apply(Math, numProcesses);
    var min = Math.min.apply(Math, numProcesses);
    var table = this.table;
    var currLabel = "";

    // TODO: if more than 15 labels, condense list and allow users to search within clusters
    if (max == min) {
       var $heading = $("<div></div>").text("All executions have " + max + " processes:");
       table.append($heading, "<br>");

       for (var i=0; i < views.length; i++) {
            currLabel = views[i].getLabel();
            var $label = $("<a></a>").text(currLabel).attr("href", currLabel);
            table.append($label, "<br>");
       }
    }
    else {
       var mid = min + Math.floor((max-min)/2);
       var lessThanMid = [];
       var moreThanMid = [];
       for (var i=0; i < numProcesses.length; i++) {
            var currNumProcess = numProcesses[i]
            if (currNumProcess <= mid) {
                if (currNumProcess == 1) {
                  lessThanMid.push(views[i].getLabel() + " - " + currNumProcess + " process");
                } else {
                  lessThanMid.push(views[i].getLabel() + " - " + currNumProcess + " processes");
                }
            } else {
                moreThanMid.push(views[i].getLabel() + " - " + currNumProcess + " processes");
            }
       }
       var $less = $("<div></div>").text("Executions with " + mid + " or less processes:");
       var $more = $("<div></div>").text("Executions with more than " + mid + " processes:");
       table.append($less, "<br>");
      
       for (var i=0; i < lessThanMid.length; i++) {
            currLabel = lessThanMid[i];
            table.append($("<a></a>").text(currLabel).attr("href", currLabel.split(" - ")[0]), "<br>");
       }

       table.append("<br>", $more, "<br>");
       for (var i=0; i < moreThanMid.length; i++) {
            currLabel = moreThanMid[i];
            table.append($("<a></a>").text(currLabel).attr("href", currLabel.split(" - ")[0]), "<br>");
       }
    }
    $("table.clusterResults").append(table);

    $("table.clusterResults a").on("click", function(e) {
       if (context.global.getPairwiseView()) {
           $(".pairwiseButton").click();
       }
       $("#viewSelectL").children("option[value='" + $(this).attr("href") + "']").prop("selected", true).change();
       e.preventDefault();
    });
};