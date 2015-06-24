/**
  * Constructs a clusterer
  *
  * @classdesc
  *
  * A clusterer separates the executions in the input log into different groups
  * based on a chosen metric. It then displays the results in the cluster tab in the
  * left sidebar. The clustering mechanism is performed after the visualization has
  * been drawn.
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

    /** @private */
    this.headings = [];

    /** @private */
    this.executionLabels = [];
 
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
  *
  * NOTE: This function should only be called after setGlobal() has been called
  */
Clusterer.prototype.cluster = function() {

    // clear the cluster table
    $(".visualization .clusterBase").remove();
    this.clearResults();

    // Create the clusters by calling helper functions
    switch (this.metric) {
        case "clusterNumProcess":
            this.clusterByNumProcesses();
            break;
        case "clusterComparison":
            this.clusterByExecComparison();
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
    var views = this.global.getViews();
    var headings = this.headings;
    var executionLabels = this.executionLabels;
    var numProcesses = [];

    // Get the number of processes in each view and save the results in numProcesses
    for (var i=0; i < views.length; i++) {
        numProcesses[i] = views[i].getHosts().length;
    }
    var max = Math.max.apply(Math, numProcesses);
    var min = Math.min.apply(Math, numProcesses);

    // If all the executions have the same number of processes, they get grouped into a single cluster
    if (max == min) {
       headings.push("All executions have " + max + " processes:");
       var labels = [];

       for (var i=0; i < views.length; i++) {
            labels.push(views[i].getLabel());
       }
       executionLabels.push(labels);
    }
    // Otherwise, the midpoint is calculated and executions are sorted into two different clusters
    else {
       var mid = min + Math.floor((max-min)/2);
       var lessThanMid = [];
       var moreThanMid = [];

       for (var i=0; i < numProcesses.length; i++) {
            var currNumProcess = numProcesses[i]
            var currLabel = views[i].getLabel();
            if (currNumProcess <= mid) {
                lessThanMid.push(currLabel);
            } else {
                moreThanMid.push(currLabel);
            }
       }
       headings.push("Executions with " + mid + " or less processes:", "Executions with more than " + mid + " processes:");
       executionLabels.push(lessThanMid, moreThanMid);
    }
    this.drawClusterLines();
};

/**
  * This function clusters executions into different groups by comparing them to a user-specified base execution.
  */
Clusterer.prototype.clusterByExecComparison = function() {
    var context = this;
    var global = this.global;

    $("table.clusterResults").append($("<input class='clusterBase' type='text'></input>").attr("placeholder", "Specify a base execution"));
    $("input.clusterBase").on("keyup", function(e) {
       if (e.keyCode == 13) {
           var base = global.getViewByLabel($(this).val());
           try {
              if (base != null) {
                   var noDiffExecs = [];
                   var sameHostsDiffEventsExecs = [];
                   var diffHostsSameEventsExecs = [];
                   var diffHostsDiffEventsExecs = [];

                   context.clearResults();

                   var baseHosts = base.getHosts();
                   var views = global.getViews();
                   for (var i=0; i < views.length; i++) {
                        var currView = views[i];
                        if (currView != base) {
                            var currViewLabel = currView.getLabel();

                            // Search for unique hosts and events in the non-base view
                            var uniqueHosts = [], uniqueEvents = [];
                            var hiddenHosts = currView.getTransformer().getHiddenHosts();
                            var sdt = new ShowDiffTransformation(base, uniqueHosts, hiddenHosts, uniqueEvents, false);
                            sdt.transform(currView.getVisualModel());
                            
                            // Search for unique hosts and events in the base
                            var baseUniqueHosts = [], baseUniqueEvents = [];
                            var baseHiddenHosts = base.getTransformer().getHiddenHosts();
                            sdt = new ShowDiffTransformation(currView, baseUniqueHosts, baseHiddenHosts, baseUniqueEvents, false);
                            sdt.transform(base.getVisualModel());

                            if (baseUniqueHosts.length > 0 || uniqueHosts.length > 0) {
                               // The current view has different hosts and different events
                               if (baseUniqueEvents.length > 0 || uniqueEvents.length > 0) {
                                    diffHostsDiffEventsExecs.push(currViewLabel);
                               }
                               // The current view has only different hosts
                               else {
                                   diffHostsSameEventsExecs.push(currViewLabel);
                               }
                            } else {
                               // The current view has the same hosts but different events
                               if (baseUniqueEvents.length > 0 || uniqueEvents.length > 0) {
                                   sameHostsDiffEventsExecs.push(currViewLabel);
                               }
                               // The current view has no differences 
                               else {
                                   noDiffExecs.push(currViewLabel);
                               }
                            }
                        }
                  }
                  if (noDiffExecs.length > 0) {
                       context.headings.push("Executions without any differences from the base:");
                       context.executionLabels.push(noDiffExecs);
                  }
                  if (sameHostsDiffEventsExecs.length > 0) {
                       context.headings.push("Executions with the same hosts and different events from the base:");
                       context.executionLabels.push(sameHostsDiffEventsExecs);
                  }
                  if (diffHostsSameEventsExecs.length > 0) {
                       context.headings.push("Executions with different hosts and the same events as the base:");
                       context.executionLabels.push(diffHostsSameEventsExecs);
                  }
                  if (diffHostsDiffEventsExecs.length > 0) {
                       context.headings.push("Executions with different hosts and different events from the base:");
                       context.executionLabels.push(diffHostsDiffEventsExecs);
                  }
                  context.drawClusterLines();                  
              } else {
                  throw new Exception("The specified execution does not appear in the input log", true);
              }
           }
           catch (err) {
              context.clearResults();
              var errhtml = err.getHTMLMessage();
              if (!err.isUserFriendly()) {
                  errhtml = "An unexpected error was encountered. Sorry!";
              }
              $("#errorbox").html(errhtml);
              $(".error").show();
           }
       }        
   });
}

/**
  * Sorts an array of execution labels based on the chosen metric for clustering:
  * When clustering by the number of processes, the labels are ordered by increasing number of processes.
  *
  * @param {Array<String>} labels The execution labels to be sorted
  */
Clusterer.prototype.sortLabels = function(labels) {
    var global = this.global;

    switch (this.metric) {
        case "clusterNumProcess":
            labels.sort(function(a,b) {
              var numA = global.getViewByLabel(a).getHosts().length;
              var numB = global.getViewByLabel(b).getHosts().length;
              return numA - numB;
            });
            break;
    }
    return labels;
}

/**
  * This function is responsible for drawing and listing executions under the appropriate cluster headings
  * For each cluster heading, it gets the corresponding execution labels and draws them underneath the heading.
  * If the cluster has more than 10 executions, the extra labels are hidden until a user expands the list.
  */
Clusterer.prototype.drawClusterLines = function() {
    var global = this.global;
    var metric = this.metric;
    var table = this.table;
    var headings = this.headings;
    var executionLabels = this.executionLabels;

    for (var i=0; i < headings.length; i++) {
          // Draw the cluster heading
          var $currHeading = $("<div></div>").text(headings[i]);
          table.append("<br>", $currHeading, "<br>");

          // Sort the labels for the executions in this cluster
          var currLabels = this.sortLabels(executionLabels[i]);

          // List the executions under the cluster heading
          for (var j=0; j < currLabels.length; j++) {
               var currLabel = currLabels[j];
               // Create a breakpoint for condensing cluster lines
               if (j == 10) {
                   table.append($("<br class=condense>").hide());
               }
               // Include the number of processes beside the label when clustering by number of processes
               if (metric == "clusterNumProcess" && headings.length > 1) {
                  var numProcess = global.getViewByLabel(currLabel).getHosts().length;
                  if (numProcess == 1) {
                      table.append($("<a></a>").text(currLabel + " - " + numProcess + " process").attr("href", currLabel), "<br>");
                  } else {
                      table.append($("<a></a>").text(currLabel + " - " + numProcess + " processes").attr("href", currLabel), "<br>");
                  }
               } else {
                   table.append($("<a></a>").text(currLabel).attr("href", currLabel), "<br>");
               }
          }
          table.append($("<br class=stop>").hide());

          // Condense the list if there are more than 10 executions
          if (currLabels.length > 10) {
              condenseClusterLines($currHeading);
          }
    }

    function condenseClusterLines(heading) {
        heading.nextAll("br.condense:first").nextUntil("br.stop:first").hide();
        table.append("<br>", $("<a></a>").text("Show all").attr("href", heading).css("color","black"), "<br>");
    }
    $("table.clusterResults").append(table);

    // Bind the click event to the cluster lines
    $("table.clusterResults a").on("click", function(e) {
        if ($(this).text() == "Show all") {
            $(this).text("Condense");
            $(this).prevAll("br.condense:first").nextUntil("br.stop").show();
        } else if ($(this).text() == "Condense") {
            $(this).text("Show all");
            $(this).prevAll("br.condense:first").nextUntil("br.stop").hide();
        } else {
          $("#viewSelectL").children("option[value='" + $(this).attr("href") + "']").prop("selected", true).change();
        }
        e.preventDefault();
    });

    // Change the graph to be that of the first execution in the clusters view
    $("#viewSelectL").children("option[value='" + $("table.clusterResults a").first().attr("href") + "']").prop("selected", true).change();
}

/**
  * Clears the results table as well as any existing headings and executions labels
  */
Clusterer.prototype.clearResults = function() {
    // Clear any existing headings and execution labels
    this.headings = [];
    this.executionLabels = [];

    // clear the table cells
    $(".visualization .clusterResults td").empty();
    $(".clusterResults td:empty").remove();
}