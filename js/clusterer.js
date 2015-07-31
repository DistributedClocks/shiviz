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
  * The headingsToLabelsMap uses heading names as a key to get an array of corresponding
  * subheadings and execution labels. The first item in the array is always the subheadings
  * and the second item is always the execution labels.
  *
  * @todo cache cluster results
  *
  * @constructor
  * @param {String} metric The chosen metric for clustering executions
  */

function Clusterer(metric, global) {

    /** @private */
    this.global = global;

    /** @private */
    this.metric = metric;

    /** @private */
    this.table = $("<td class='lines'></td>");

    /** @private */
    // An array of headings for clusters of executions, for example: "Same hosts as base"
    this.headings = [];

    /** @private */
    this.headingsToLabelsMap = {};
}

/**
  * This function delegates clustering to the appropriate helper function based on
  * the metric that was set when the Clusterer was constructed
  *
*/
Clusterer.prototype.cluster = function() {

    // clear this Clusterer's arrays and the results table
    $("#baseLabel, .clusterBase").hide();
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
        this.headingsToLabelsMap[headings[0]] = [[], [labels]];
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
       this.headingsToLabelsMap[headings[0]] = [[], [lessThanMid]];
       this.headingsToLabelsMap[headings[1]] = [[], [moreThanMid]];

    }
    this.drawClusterResults();
};

/**
  * This function clusters executions into different groups by comparing them to a user-specified base execution.
  * The two main headings are "Same hosts" and "Different hosts". The subheadings are "Same Events" and "Different Events".
  */
Clusterer.prototype.clusterByExecComparison = function() {
    var context = this;
    var global = this.global;

    $("#baseLabel").show();
    $(".clusterBase").show().find("option").not("#placeholder").remove();

    // Set margin for base dropdown to zero initially
    $(".clusterBase").removeClass("baseIndent fade");

    global.getViews().forEach(function(view) {
        var label = view.getLabel();
        $(".clusterBase").append('<option value="' + label + '">' + label + '</option>');
    });

    $(".clusterBase").unbind().on("change", compareExecsToNewBase);

    function compareExecsToNewBase() {
         var base = global.getViewByLabel($(".clusterBase option:selected").val());
         var noDiffExecs = [];
         var sameHostsDiffEventsExecs = [];
         var diffHostsSameEventsExecs = [];
         var diffHostsDiffEventsExecs = [];

         // Clear the table results whenever a new base is selected
         context.clearResults();

         var views = global.getViews();
         for (var i=0; i < views.length; i++) {
              var currView = views[i];

              // Compare every view to the base
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

        // Determine which headings and subheadings should be drawn, map subheadings and execution labels to proper headings

        if (noDiffExecs.length > 0 || sameHostsDiffEventsExecs.length > 0) {
             context.headings.push("Same hosts as base:");
             var sameHostsSubheadings = [];
             var sameHostsExecLabels = [];

             if (noDiffExecs.length > 0) {
                 sameHostsSubheadings.push("Same events as base:");
                 sameHostsExecLabels.push(noDiffExecs);
             }
             if (sameHostsDiffEventsExecs.length > 0) {
                 sameHostsSubheadings.push("Different events from base:");
                 sameHostsExecLabels.push(sameHostsDiffEventsExecs);
             }
             context.headingsToLabelsMap["Same hosts as base:"] = [sameHostsSubheadings, sameHostsExecLabels];
        }

        if (diffHostsSameEventsExecs.length > 0 || diffHostsDiffEventsExecs.length > 0) {
             context.headings.push("Different hosts from base:");
             var diffHostsSubheadings = [];
             var diffHostsExecLabels = [];

             if (diffHostsSameEventsExecs.length > 0) {
                 diffHostsSubheadings.push("Same events as base:");
                 diffHostsExecLabels.push(diffHostsSameEventsExecs);
             }
             if (diffHostsDiffEventsExecs.length > 0) {
                 diffHostsSubheadings.push("Different events from base:");
                 diffHostsExecLabels.push(diffHostsDiffEventsExecs);
             }
             context.headingsToLabelsMap["Different hosts from base:"] = [diffHostsSubheadings, diffHostsExecLabels];
        }
        context.drawClusterResults();
    }
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
  * Condenses the list of execution labels beloning to the given heading or subheading
  *
  * @param {jQuery.selection} heading A jQuery selection of the heading or subheading whose execution labels need to be condensed
  */
Clusterer.prototype.condenseExecLabels = function(heading) {
    heading.nextAll("br.condense:first").nextUntil("br.stop:first").hide();
    this.table.append("<br>", $("<a></a>").text("Show all").attr("href", heading).css("color","black"), "<br>");
}

/**
  * Draws the given list of execution labels and calls condenseExecLabels() when appropriate
  *
  * @param {Array<String>} currLabels The execution labels to be drawn
  * @param {jQuery.selection} currHeading A jQuery selection of the heading or subheading that currLabels is drawn under
  */
Clusterer.prototype.drawExecLabels = function(currLabels, currHeading) {
    var table = this.table;
    var global = this.global;

    for (var index=0; index < currLabels.length; index++) {
         var currLabel = currLabels[index];
         // Create a breakpoint for condensing execution labels
         if (index == 5) {
             table.append($("<br class=condense>").hide());
         }
         // Include the number of processes beside the label when clustering by number of processes
         if (this.metric == "clusterNumProcess" && this.headings.length > 1) {
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

    // Condense the list if there are more than 5 executions
    if (currLabels.length > 5) {
        this.condenseExecLabels(currHeading);
    }
}

/**
  * Draws the cluster headings and subheadings and passes the appropriate execution labels to drawExecLabels().
  * Formats and binds events to results after all execution labels for all headings and subheadings have been drawn.
  */
Clusterer.prototype.drawClusterResults = function() {
    var global = this.global;
    var metric = this.metric;
    var table = this.table;
    var clusterer = this;

    this.headings.forEach(function(heading) {
          // Draw the cluster heading
          var $currHeadingLabel = $("<p></p>").text(heading);
          table.append($currHeadingLabel);

          // Get the subheadings for this heading
          var subheadings = clusterer.headingsToLabelsMap[heading][0];
          // Get the array of executions labels for this heading
          var execLabelsArray = clusterer.headingsToLabelsMap[heading][1];
          var currLabels = [];

          // If the subheadings array is empty, there's only one array of execution labels
          if (subheadings.length == 0) {
              currLabels = clusterer.sortLabels(execLabelsArray[0]);
              clusterer.drawExecLabels(currLabels, $currHeadingLabel);

          // Otherwise, draw the subheadings and the corresponding execution labels beneath them
          } else {
              for (var index=0; index < subheadings.length; index++) {
                  var $subheadingLabel = $("<p></p>").text(subheadings[index]).addClass("indent");
                  table.append($subheadingLabel);
                  currLabels = clusterer.sortLabels(execLabelsArray[index])
                  clusterer.drawExecLabels(currLabels, $subheadingLabel);
              }
          }
    });

    table.find("a").addClass("indent");
    $("table.clusterResults").append(table);

    $("#labelIconL, #selectIconL").show();
    if (global.getPairwiseView()) {
        $("#labelIconR, #selectIconR").show();
    }

    // For comparison clustering, by default, make the graph on the right the base execution
    if (metric == "clusterComparison") {
        // Shift the cluster results down to make room for the base label and dropdown
        $("td.lines").addClass("shiftDown");
        var baseExec = $(".clusterBase option:selected").val();
        this.setView("R", baseExec);
    // For other clustering options, make the graph on the right the second execution in the results
    } else {
        $("td.lines").removeClass("shiftDown");
        var secondExec = $(".clusterResults a").first().nextAll("a:first").attr("href");
        this.setView("R", secondExec);
    }

    // Change the left graph to be that of the first execution in the first cluster
    var firstExec = $(".clusterResults a").first().attr("href");
    this.setView("L", firstExec);

    // Bind the click event to the cluster results
    $(".clusterResults a").on("click", function(e) {
        var anchorText = $(this).text();
        var anchorHref = $(this).attr("href");

        if (anchorText == "Show all") {
            $(this).text("Condense");
            $(this).prevAll("br.condense:first").nextUntil("br.stop").not("br.left, br.right").show();
        } else if (anchorText == "Condense") {
            $(this).text("Show all");

            // Condense up to the nearest left or right arrow icon instead of all the way up
            var prevCondense = $(this).prevAll("br.condense:first");
            var prevLeft = $(this).prevAll("br.left");
            var prevRight = $(this).prevAll("br.right");

            if (prevCondense.nextUntil("br.stop", "br.left").length > 0) {
                if (prevLeft.nextUntil("br.stop", "br.right").length > 0) {
                    prevRight.nextUntil("br.stop").hide();
                } else {
                    prevLeft.nextUntil("br.stop").hide();
                }
            } else if (prevCondense.nextUntil("br.stop", "br.right").length > 0) {
                prevRight.nextUntil("br.stop").hide();
            } else {
                prevCondense.nextUntil("br.stop").hide();
            }
        } else {
            clusterer.setView("L", anchorHref);
        }
        e.preventDefault();
    });
}

/**
  * Sets the view in the given position to the execution with the label specified by anchorHref
  *
  * @param {String} position Either "L" or "R" to indicate the left or right view
  * @param {String} anchorHref The label of the execution to be set
  *
  */
Clusterer.prototype.setView = function(position, anchorHref) {
    var global = this.global;
    var leftView = global.getActiveViews()[0].getLabel();
    var rightView = global.getActiveViews()[1].getLabel();

    if ((position == "L" && anchorHref == rightView) || (position == "R" && global.getPairwiseView() && anchorHref == leftView)) {
        global.swapViews();
    } else {
        // For logs with exactly two executions, there are no execution drop-downs so have to call drawClusterIcons directly
        if (global.getPairwiseView() && global.getViews().length == 2) {
            global.drawClusterIcons();
        } else {
            if (position == "L") {
                $("#viewSelectL").children("option[value='" + anchorHref + "']").prop("selected", true).change();
            } else {
                $("#viewSelectR").children("option[value='" + anchorHref + "']").prop("selected", true).change();                 
            }                
        }
    }
}

/**
  * Clears the results table as well as any existing headings, subheadings and executions labels
  */
Clusterer.prototype.clearResults = function() {
    this.headings = [];
    this.headingsToLabelsMap = {};

    // clear the cluster results
    $(".clusterResults td.lines").empty();
    $(".clusterResults td:empty").remove();
}