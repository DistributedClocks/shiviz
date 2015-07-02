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
    this.headingsToLabelsMap = {};
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

    // clear this Clusterer's arrays and the results table
    $(".visualization .clusterBase, #baseLabel").remove();
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
    var map = this.headingsToLabelsMap;
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
       map[headings[0]] = [[], [labels]];
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
       map[headings[0]] = [[], [lessThanMid]]; map[headings[1]] = [[], [moreThanMid]];

    }
    this.drawClusterLines();
};

/**
  * This function clusters executions into different groups by comparing them to a user-specified base execution.
  * The two main headings are "Same hosts" and "Different hosts". The subheadings are "Same Events" and "Different Events".
  */
Clusterer.prototype.clusterByExecComparison = function() {
    var context = this;
    var global = this.global;

    // Text input area for Issue 128
    /**$("table.clusterResults").append($("<input class='clusterBase' type='text'></input>").attr("placeholder", "Specify a base execution"));
    $("input.clusterBase").on("keyup", function(e) {
       if (e.keyCode == 13) { **/

    var baseLabel = $("<label id ='baseLabel'></label>").text("Base execution:");
    var execsList = $("<select class='clusterBase'></select>");
    // Set a placeholder for the drop-down
    execsList.append($("<option value=''></option>").prop("disabled", true).prop("selected", true).css("display", "none").text("Select a base execution"));
    $("table.clusterResults").append(baseLabel, execsList);

    global.getViews().forEach(function(view) {
        var label = view.getLabel();
        execsList.append('<option value="' + label + '">' + label + '</option>');
    });

    $("select.clusterBase").unbind().on("change", function() {
         var base = global.getViewByLabel($(".clusterBase option:selected").val());
         var noDiffExecs = [];
         var sameHostsDiffEventsExecs = [];
         var diffHostsSameEventsExecs = [];
         var diffHostsDiffEventsExecs = [];

         // Clear the table results whenever a new base is selected
         context.clearResults();

         var baseHosts = base.getHosts();
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
        var headings = context.headings;
        var map = context.headingsToLabelsMap;

        // Determine which headings and subheadings should be drawn, map subheadings and execution labels to proper headings

        if (noDiffExecs.length > 0 || sameHostsDiffEventsExecs.length > 0) {
             headings.push("Same hosts as base:");
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
             map["Same hosts as base:"] = [sameHostsSubheadings, sameHostsExecLabels];
        }
        if (diffHostsSameEventsExecs.length > 0 || diffHostsDiffEventsExecs.length > 0) {
             headings.push("Different hosts from base:");
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
             map["Different hosts from base:"] = [diffHostsSubheadings, diffHostsExecLabels];
        }
        context.drawClusterLines();
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

    for (var k=0; k < currLabels.length; k++) {
         var currLabel = currLabels[k];
         // Create a breakpoint for condensing execution labels
         if (k == 5) {
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

    // Condense the list if there are more than 10 executions
    if (currLabels.length > 5) {
        this.condenseExecLabels(currHeading);
    }
}

/**
  * Draws the cluster headings and subheadings and passes the appropriate execution labels to drawExecLabels().
  * Formats and binds events to results after all execution labels for all headings and subheadings have been drawn.
  */
Clusterer.prototype.drawClusterLines = function() {
    var global = this.global;
    var metric = this.metric;
    var table = this.table;
    var headings = this.headings;
    var map = this.headingsToLabelsMap;

    for (var i=0; i < headings.length; i++) {
          // Draw the cluster heading
          var currHeading = headings[i];
          var $currHeadingLabel = $("<p></p>").text(currHeading);
          table.append($currHeadingLabel);

          // Get the subheadings for this heading
          var subheadings = map[currHeading][0];
          // Get the array of executions labels for this heading
          var execLabelsArray = map[currHeading][1];
          var currLabels = [];

          // If the subheadings array is empty, there's only one array of execution labels
          if (subheadings.length == 0) {
              currLabels = this.sortLabels(execLabelsArray[0]);
              this.drawExecLabels(currLabels, $currHeadingLabel);

          // Otherwise, draw the subheadings and the corresponding execution labels beneath them
          } else {
              for (var j=0; j < subheadings.length; j++) {
                  var $subheadingLabel = $("<p></p>").text(subheadings[j]).addClass("indent");
                  table.append($subheadingLabel);
                  currLabels = this.sortLabels(execLabelsArray[j])
                  this.drawExecLabels(currLabels, $subheadingLabel);
              }
          }
    }

    table.find("a").addClass("indent");
    $("table.clusterResults").append(table);

    // When there are only two executions in pairwise view, the execution labels are not dropdowns
    // so the event handlers won't be triggered -- have to draw the arrow icons separately
    if (global.getViews().length == 2 && global.getPairwiseView()) {
        global.drawClusterIcons();
    }

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

    $("#labelIconL, #labelIconR, #selectIconL, #selectIconR").show();
    // Change the left view graph to be that of the first execution that's not in the right view
    var first = $("table.clusterResults a").filter(function() {
        return $(this).attr("href") != $("#viewSelectR option:selected").val();
    });
    $("#viewSelectL").children("option[value='" + first.attr("href") + "']").prop("selected", true).change();;
    // Trigger changes in dropdowns to draw arrow icons beside execution labels
    $("#viewSelectR").change();
}

/**
  * Clears the results table as well as any existing headings, subheadings and executions labels
  */
Clusterer.prototype.clearResults = function() {
    this.headings = [];
    this.headingsToLabelsMap = {};

    // clear the table cells
    $("table.clusterResults td").empty();
    $("table.clusterResults td:empty").remove();

}