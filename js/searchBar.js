/**
 * SearchBar is a Singleton. Do not call its constructor directly. Use
 * SearchBar.getInstance()
 * 
 * @classdesc
 * 
 * <p>
 * As the name suggests, SearchBar represents the search bar found in Shiviz's
 * visualization page. Both the text input and the drop-down panel are
 * considered part of the search bar. This class is responsible for binding user
 * input to the search bar with the appropriate actions.
 * </p>
 * 
 * <p>
 * Text searches, pre-defined motif searches, and user-define motif searches can
 * all be performed with the search bar. The SearchBar's mode indicates what
 * type of query is currently being performed and is one of the mode static
 * constants defined in this class (e.g. {@link SearchBar.MODE_TEXT}).
 * </p>
 * 
 * <p>
 * The search bar is associated with a {@link Global}. That global is what will
 * be searched through and modified when a search is performed.
 * </p>
 * 
 * @constructor
 */
function SearchBar() {

    if (SearchBar.instance)
        throw new Exception("Cannot instantiate SearchBar, instance already exists");

    SearchBar.instance = this;

    /** @private */
    this.global = null;

    /** @private */
    this.motifNavigator = null;

    /** @private */
    this.graphBuilder = new GraphBuilder($("#panel svg"), $("#addButton"), false);

    /** @private */
    this.mode = SearchBar.MODE_EMPTY;

    /** @private */
    this.updateLocked = false;

    var context = this;

    // Called whenever a change is made to the GraphBuilder -- either through drawing a custom structure or through clearStructure()
    this.graphBuilder.setUpdateCallback(function() {
        if (context.updateLocked) {
            return;
        }

        var vts = new VectorTimestampSerializer("{\"host\":\"`HOST`\",\"clock\":`CLOCK`}", ",", "#structure=[", "]");
        var builderGraph = this.convertToBG();
        if (!this.isCleared()) {
            context.setValue(vts.serialize(builderGraph.toVectorTimestamps()));
        }
    });

    $("#searchbar #bar input").unbind("keydown.search").on("keydown.search", function(e) {
        // Only act when panel is expanded
        if (!context.isPanelShown())
            return;

        switch (e.which) {
        // Return
        case 13:
            if (context.getValue().trim().length > 0) {
                context.query();
                context.hidePanel();
            }
            break;

        // Escape
        case 27:
            context.hidePanel();
            break;
        }
    });

    $("#searchbar #bar input").on("input", function() {
        context.clearResults();
        context.update();
    }).on("focus", function() {
        context.showPanel();
    });

    $("#searchButton").on("click", function(e) {
        if (e.ctrlKey && e.altKey) {
            var regexp = '(?<event>){"host":"(?<host>[^}]+)","clock":(?<clock>{[^}]*})}';
            Shiviz.getInstance().visualize(context.getValue(), regexp, "", "order", false);
        }
        else {
            context.query();
        }
        context.hidePanel();
    });

    $("#searchbar #bar .clear").on("click", function() {
        context.updateLocked = true;
        context.clear();
        context.hidePanel();
        context.update();
        context.updateLocked = false;
        context.clearMotifsTab();
    });

    $("#searchbar .predefined button").on("click", function() {
        context.clearStructure();
        context.setValue("#" + this.name);
        context.hidePanel();
        context.query();
    });

    $("#nextButton").on("click", function() {
        if (context.motifNavigator == null) {
            return;
        }
        context.motifNavigator.next();
        context.hidePanel();
    });

    $("#prevButton").on("click", function() {
        if (context.motifNavigator == null) {
            return;
        }
        context.motifNavigator.prev();
        context.hidePanel();
    });

    // Event handler for switching between search options
    $("#searchbar .searchTabLinks a").on("click", function(e) {
        // Show the clicked on tab and hide the others
        var currentTab = $(this).attr("href");
        $("#searchbar #" + currentTab).show().siblings("div").hide();
        $(this).parent("li").addClass("default").siblings("li").removeClass("default");
        // prevent id of div from being added to URL
        e.preventDefault();
    });

    // Event handler for motif selection in network motifs tab
    $("#motifOption input").on("change", function() {
        if ($(this).is(":checked") || $(this).siblings("input:checkbox:checked").length > 0) {
            context.setValue("#motif");
            $("#searchButton").click();
        } else {
            context.clearText();
            $(".motifResults td").empty();
        }
        context.clearStructure();
    });
}

/**
 * @static
 * @const
 */
SearchBar.MODE_EMPTY = 0;

/**
 * @static
 * @const
 */
SearchBar.MODE_TEXT = 1;

/**
 * @static
 * @const
 */
SearchBar.MODE_CUSTOM = 2;

/**
 * @static
 * @const
 */
SearchBar.MODE_PREDEFINED = 3;

/**
 * @static
 * @const
 */
SearchBar.MODE_MOTIF = 4;

/**
 * @private
 * @static
 */
SearchBar.instance = null;

/**
 * Gets the SearchBar instance.
 * 
 * @static
 */
SearchBar.getInstance = function() {
    return SearchBar.instance || new SearchBar();
};

/**
 * Sets the global associated with this search bar. The global associated with
 * this search bar is what will be searched through and modified when a search
 * is performed.
 * 
 * @param {Global} global the global associated with this search bar.
 */
SearchBar.prototype.setGlobal = function(global) {
    this.global = global;
};

/**
 * Returns the global associated with this search bar.
 *
 * @returns {Global} global the global associated with this search bar
 */
SearchBar.prototype.getGlobal = function(global) {
    return this.global;
};

/**
 * Updates the mode of this search bar. The mode indicates what type of query is
 * currently being performed and is one of the mode static constants defined in
 * this class (e.g. {@link SearchBar.MODE_TEXT}). This method automatically
 * deduces what type of query is currently entered based on the contents of the
 * text field.
 */
SearchBar.prototype.updateMode = function() {
    var value = this.getValue().trim();

    $("#searchbar #bar input").css("color", "initial");

    if (value.length == 0) {
        this.mode = SearchBar.MODE_EMPTY;
        $("#searchButton").prop("disabled", true);
        $("#searchbar input").addClass("empty");
        return;
    }
    else {
        $("#searchButton").prop("disabled", false);
        $("#searchbar input").removeClass("empty");
    }

    if (value.charAt(0) != "#") {
        this.mode = SearchBar.MODE_TEXT;
    }
    else if (value.slice(0, 11) == "#structure=") {
        this.mode = SearchBar.MODE_CUSTOM;
    }
    else if (value.slice(0, 7) == "#motif") {
        this.mode = SearchBar.MODE_MOTIF;
    }
    else {
        this.mode = SearchBar.MODE_PREDEFINED;
    }

};

/**
 * Gets the current mode the search bar is in. The mode indicates what type of
 * query is currently being performed and is one of the mode static constants
 * defined in this class (e.g. {@link SearchBar.MODE_TEXT}).
 * 
 * @returns {Number} the mode
 */
SearchBar.prototype.getMode = function() {
    return this.mode;
};

/**
 * Updates the search bar to reflect any changes made to either the text or the
 * drawn graph.
 */
SearchBar.prototype.update = function() {

    this.updateLocked = true;
    this.updateMode();

    switch (this.mode) {

    // Empty
    case SearchBar.MODE_EMPTY:
        this.clearStructure();

        break;

    // Text
    case SearchBar.MODE_TEXT:
        this.clearStructure();
        break;

    // Custom structure
    case SearchBar.MODE_CUSTOM:
        try {
            var json = this.getValue().trim().match(/^#(?:structure=)?(\[.*\])/i)[1];
            var builderGraph = this.getBuilderGraphFromJSON(json);
            this.graphBuilder.convertFromBG(builderGraph);
        }
        catch (exception) {
            this.clearStructure();
            $("#searchbar #bar input").css("color", "red");
        }
        break;

    // Predefined Structure
    case SearchBar.MODE_PREDEFINED:
        this.clearStructure();
        break;

    // Network motifs
    case SearchBar.MODE_MOTIF:
        break;

    default:
        throw new Exception("Invalid mode in SearchBar");
        break;
    }

    this.updateLocked = false;
};

/**
 * Gets the value of the text in the search bar.
 * 
 * @returns {String} The text in the search bar
 */
SearchBar.prototype.getValue = function() {
    return $("#searchbar #bar input").val();
};

/**
 * Sets the value of the text in the search bar
 * 
 * @param {String} val The new value of the text in the search bar
 */
SearchBar.prototype.setValue = function(val) {
    $("#searchbar #bar input").val(val);
    this.updateMode();
};

/**
 * Determines if the drop-down panel is currently shown
 * 
 * @returns {Boolean} true if drop-down panel is shown
 */
SearchBar.prototype.isPanelShown = function() {
    return $("#searchbar #panel:visible").length;
};

/**
 * Shows the drop-down panel
 */
SearchBar.prototype.showPanel = function() {
    var context = this;

    $("#searchbar input").addClass("focus");
    $("#searchbar #panel").show();
    $(window).on("mousedown", function(e) {
        var $target = $(e.target);
        if (!$target.parents("#searchbar").length)
            context.hidePanel();
    });
};

/**
 * Hides the drop-down panel
 */
SearchBar.prototype.hidePanel = function() {
    $("#bar input").blur().removeClass("focus");
    $(".hostConstraintDialog").hide();
    $("#searchbar #panel").hide();
    $(window).unbind("mousedown");
};

/**
 * Clears the drawn structure
 */
SearchBar.prototype.clearStructure = function() {
    this.graphBuilder.clear();
};

/**
 * Clears the text input
 */
SearchBar.prototype.clearText = function() {
    this.setValue("");
};

/**
 * Clears search results. In other words, un-highlights found nodes and motifs
 */
SearchBar.prototype.clearResults = function() {
    $("#searchbar").removeClass("results");
    this.motifNavigator = null;
    if (this.global != null && this.global.getController().hasHighlight()) {
        this.global.getController().clearHighlight();
    } else {
        // Show the pairwise button on the log lines tab when clearing a motif search
        if (this.global.getViews().length > 1 && !$(".leftTabLinks li").first().next().hasClass("default") && !$(".pairwiseButton").is(":visible")) {
            $(".pairwiseButton").show();
        }
    }
    $(".clusterBase").removeClass("fade");
    $(".clusterResults a").removeClass("execFade");
};

/**
 * Clears the drawn motif, the text input, and the search results
 * 
 * @see {@link SearchBar#clearStructure}
 * @see {@link SearchBar#clearText}
 * @see {@link SearchBar#clearResults}
 */
SearchBar.prototype.clear = function() {
    this.clearStructure();
    this.clearText();
    this.clearResults();
};

/**
 * Performs a query based on what is currently in the text field.
 */
SearchBar.prototype.query = function() {
    this.updateMode();
    var searchbar = this;

    try {
        switch (this.mode) {
        case SearchBar.MODE_EMPTY:
            this.clearResults();
            break;

        case SearchBar.MODE_TEXT:
            var finder = new TextQueryMotifFinder(this.getValue());
            this.global.getController().highlightMotif(finder);
            break;

        case SearchBar.MODE_CUSTOM:
            try {
                var json = this.getValue().trim().match(/^#(?:structure=)?(\[.*\])/i)[1];
                var builderGraph = this.getBuilderGraphFromJSON(json);
                var finder = new CustomMotifFinder(builderGraph);
                this.global.getController().highlightMotif(finder);
            }
            catch (exception) {
                $("#searchbar #bar input").css("color", "red");
                return;
            }
            break;

        case SearchBar.MODE_PREDEFINED:
            var value = this.getValue();
            var type = value.trim().match(/^#(?:motif=)?(.*)/i)[1];

            if (type == "request-response") {
                var finder = new RequestResponseFinder(999, 4);
                this.global.getController().highlightMotif(finder);
                break;
            }
            else if (type == "broadcast" || type == "gather") {
                var broadcast;
                if (type == "broadcast")
                    broadcast = true;
                else
                    broadcast = false;

                this.global.getViews().forEach(function(view) {

                    var hiddenHosts = view.getTransformer().getHiddenHosts();
                    var hiddenHosts = view.getTransformer().getHiddenHosts();
                    var hosts = view.getHosts().filter(function(h) {
                        return !hiddenHosts[h];
                    }).length;
                    var finder = new BroadcastGatherFinder(hosts - 1, 4, broadcast);

                    view.getTransformer().highlightMotif(finder, false);
                });

                this.global.drawAll();
            }
            else {
                throw new Exception(type + " is not a built-in motif type", true);
            }

            break;

        case SearchBar.MODE_MOTIF:
            var prefix = "/shiviz/log/";
            var url = prefix + "motifs.json";

            $.get(url, function(response) {
                handleMotifResponse(response);
            }).fail(function() {
                prefix = "https://api.github.com/repos/bestchai/shiviz-logs/contents/";
                url = prefix + "motifs.json";

                $.get(url, function(response) {
                    response = atob(response.content);
                    handleMotifResponse(response);
                }).fail(function() {
                    Shiviz.getInstance().handleException(new Exception("unable to retrieve motifs from: " + url, true));
                });
            });
            break;

        default:
            throw new Exception("SearchBar.prototype.query: invalid mode");
            break;
        }
    }
    catch (e) {
        Shiviz.getInstance().handleException(e);
    }
    if (this.mode != SearchBar.MODE_MOTIF) {
        // reset the motifs tab when performing other searches
        this.clearMotifsTab();

        // For the network motifs search, motifs are only highlighted when a user clicks on an execution in the motifs tab
        // so countMotifs() should not be called during the initial search but during the on-click event in MotifDrawer.js
        $("#searchbar").addClass("results");
        this.countMotifs();
    }

    function handleMotifResponse(response) {
        var lines = response.split("\n");
        var viewToCount = {};
        var builderGraphs = [];

        // Get the relevant subgraphs from motifs.json based on ticked checkboxes
        var twoEventCutoff = lines.indexOf("2-event subgraphs");
        var threeEventCutoff = lines.indexOf("3-event subgraphs");
        var fourEventCutoff = lines.indexOf("4-event subgraphs");                

        if (!$("#motifOption #fourEvents").is(":checked")) {
            lines.splice(fourEventCutoff, lines.length - fourEventCutoff);
        }

        if (!$("#motifOption #threeEvents").is(":checked")) {
            lines.splice(threeEventCutoff, fourEventCutoff - threeEventCutoff);     
        }

        if (!$("#motifOption #twoEvents").is(":checked")) {
            var twoEventCutoff = lines.indexOf("2-event subgraphs");
            lines.splice(twoEventCutoff, threeEventCutoff - twoEventCutoff);
        }

        // Find the number of instances of a subgraph in each view
        lines.forEach(function(line) {
            if (isNaN(line.charAt(0))) {
                var builderGraph = searchbar.getBuilderGraphFromJSON(line);
                builderGraphs.push(builderGraph);

                var finder = new CustomMotifFinder(builderGraph);
                var hmt = new HighlightMotifTransformation(finder, false);

                searchbar.global.getViews().forEach(function(view) {
                    var label = view.getLabel();

                    hmt.findMotifs(view.getModel());
                    var motifGroup = hmt.getHighlighted();
                    var numMotifs = motifGroup.getMotifs().length;

                    // Save the number of instances of this motif under the current view's label
                    if (viewToCount[label]) {
                        viewToCount[label].push(numMotifs);
                    } else {
                        viewToCount[label] = [numMotifs];
                    }
                });
            }
        });
        
        // Calculate motifs and draw the results in the motifs tab
        var motifDrawer = new MotifDrawer(viewToCount, builderGraphs);
        motifDrawer.drawResults();

        // Switch to the Motifs tab and clear any previously highlighted results
        $(".leftTabLinks li").first().next().show().find("a").click();
        searchbar.clearResults();
    }
};

/**
  * Creates a BuilderGraph from a json object containing hosts and vector timestamps
  *
  * @param {String} json The json object specifying hosts and vector timestamps
  * @returns {BuilderGraph} the builderGraph created from the given json object
  */
SearchBar.prototype.getBuilderGraphFromJSON = function(json) {
    var rawRegExp = '(?<event>){"host":"(?<host>[^}]+)","clock":(?<clock>{[^}]*})}';
    var parsingRegex = new NamedRegExp(rawRegExp, "i");
    var parser = new LogParser(json, null, parsingRegex);
    var logEvents = parser.getLogEvents(parser.getLabels()[0]);
    var vectorTimestamps = logEvents.map(function(logEvent) {
        return logEvent.getVectorTimestamp();
    });
    var gbHosts = this.graphBuilder.getHosts();
    var hostConstraints = gbHosts.map(function(gbHost) {
        return gbHost.getConstraint() != "";
    });
    return BuilderGraph.fromVectorTimestamps(vectorTimestamps, hostConstraints);
}

/**
  * This function creates a new MotifNavigator to count the number of times a highlighted motif occurs in the active views
  */
SearchBar.prototype.countMotifs = function() {
    // Only compute and display the motif count if a search is being performed
    if ($("#searchbar").hasClass("results")) {
        var views = this.global.getActiveViews();
        this.motifNavigator = new MotifNavigator();
        this.motifNavigator.addMotif(views[0].getVisualModel(), views[0].getTransformer().getHighlightedMotif());
        if (this.global.getPairwiseView()) {
            this.motifNavigator.addMotif(views[1].getVisualModel(), views[1].getTransformer().getHighlightedMotif());
        }
        this.motifNavigator.start();
    
        var numMotifs = this.motifNavigator.getNumMotifs();
        var numInstances = numMotifs + " instance";
        if (numMotifs == 0 || numMotifs > 1) {
            numInstances = numInstances.concat("s");
        }
        $("#numFound").text(numInstances + " in view");
    }
};

/**
 * Clears the results in the motifs tab and uncheck all the checkboxes
 */
SearchBar.prototype.clearMotifsTab = function() {
    $("#motifOption input").prop("checked", false);
    $(".motifResults td").empty();
    $(".motifResults td:empty").remove();
}

/**
 * Resets the motif results so that no execution is selected
 */
SearchBar.prototype.resetMotifResults = function() {
    // Clear the #motif value in the searchbar if not on the motifs tab
    if (!$(".leftTabLinks li").first().next().hasClass("default")) {
        this.clearText();
    }
    $("#motifIcon").remove();
    $(".motifResults a").removeClass("indent");
}