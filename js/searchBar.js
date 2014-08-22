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
    this.graphBuilder = new GraphBuilder($("#panel svg"), $("#addButton"));

    /** @private */
    this.mode = SearchBar.MODE_EMPTY;

    /** @private */
    this.updateLocked = false;

    var context = this;

    this.graphBuilder.setUpdateCallback(function() {

        if (context.updateLocked) {
            return;
        }

        var vts = new VectorTimestampSerializer("{\"host\":\"`HOST`\",\"clock\":`CLOCK`}", ",", "#motif=[", "]");
        var builderGraph = this.convertToBG();
        context.setValue(vts.serialize(builderGraph.toVectorTimestamps()));

        context.updateMode();
    });

    $(window).unbind("keydown.search").on("keydown.search", function(e) {
        // Only act when panel is expanded
        if (!context.isPanelShown())
            return;

        switch (e.which) {
            // Return
            case 13:
                context.query();
                context.hidePanel();
                break;

            // Escape
            case 27:
                context.hidePanel();
                break;
        }
    });

    $("#searchbar #bar input").on("input", function() {
        context.update();
    }).on("focus", function() {
        context.showPanel();
    });

    $("#searchbar #bar button").on("click", function(e) {
        if (e.ctrlKey && e.altKey) {
            var regexp = '(?<event>){"host":"(?<host>[^}]+)","clock":(?<clock>{[^}]*})}';
            Shiviz.getInstance().visualize(context.getValue(), regexp, "", "order", false);
        } else {
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
    });

    $("#searchbar .predefined button").on("click", function() {
        context.setValue("#" + this.name);
        context.hidePanel();
        context.query();
    });

    this.update();
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
SearchBar.MODE_STRUCTURAL = 2;

/**
 * @static
 * @const
 */
SearchBar.MODE_PREDEFINED = 3;

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
 * Updates the mode of this search bar. The mode indicates what type of query is
 * currently being performed and is one of the mode static constants defined in
 * this class (e.g. {@link SearchBar.MODE_TEXT}). This method automatically
 * deduces what type of query is currently entered based on the contents of the
 * text field.
 */
SearchBar.prototype.updateMode = function() {
    var value = this.getValue();
    
    $("#searchbar #bar input").css("color", "initial");

    if (value.trim().length == 0) {
        this.mode = SearchBar.MODE_EMPTY;
        $("#bar button").prop("disabled", true);
        $("#searchbar input").addClass("empty");
        return;
    } else {
        $("#bar button").prop("disabled", false);
        $("#searchbar input").removeClass("empty");
    }

    this.clearResults();
    
    if (value.indexOf("#") < 0)
        this.mode = SearchBar.MODE_TEXT;
    else if (value.trim().match(/^#(motif\s*=\s*)?(\[.*\])/i) != null)
        this.mode = SearchBar.MODE_STRUCTURAL;
    else
        this.mode = SearchBar.MODE_PREDEFINED;
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
    var value = this.getValue();

    this.updateLocked = true;
    this.updateMode();

    switch (this.mode) {

        // Empty
        case SearchBar.MODE_EMPTY:
            this.clearMotif();

            break;

        // Text
        case SearchBar.MODE_TEXT:
            this.clearMotif();
            break;

        // Motif (custom)
        case SearchBar.MODE_STRUCTURAL:
            try {
                var json = value.trim().match(/^#(?:motif\s*=\s*)?(\[.*\])/i)[1];
                var rawRegExp = '(?<event>){"host":"(?<host>[^}]+)","clock":(?<clock>{[^}]*})}';
                var parsingRegex = new NamedRegExp(rawRegExp, "i");
                var parser = new LogParser(json, null, parsingRegex);
                var logEvents = parser.getLogEvents(parser.getLabels()[0]);
                var vectorTimestamps = logEvents.map(function(logEvent) {
                    return logEvent.getVectorTimestamp();
                });
                var builderGraph = BuilderGraph.fromVectorTimestamps(vectorTimestamps);
                this.graphBuilder.convertFromBG(builderGraph);
            }
            catch(exception) {
                $("#searchbar #bar input").css("color", "red");
            }
            break;

        // Predefined Motif
        case SearchBar.MODE_PREDEFINED:
            this.clearMotif();
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
    $("#searchbar #panel").hide();
    $(window).unbind("mousedown");
};

/**
 * Clears the drawn motif.
 */
SearchBar.prototype.clearMotif = function() {
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
    this.global.getViews().forEach(function(view) {
        view.getTransformer().unhighlightMotif();
    });
    this.global.drawAll();
};

/**
 * Clears the drawn motif, the text input, and the search results
 * 
 * @see {@link SearchBar#clearMotif}
 * @see {@link SearchBar#clearText}
 * @see {@link SearchBar#clearResults}
 */
SearchBar.prototype.clear = function() {
    this.clearMotif();
    this.clearText();
    this.clearResults();
};

/**
 * Performs a query based on what is currently in the text field.
 */
SearchBar.prototype.query = function() {
    this.updateMode();

    try {
        switch (this.mode) {
            case SearchBar.MODE_EMPTY:
                this.clearResults();
                break;

            case SearchBar.MODE_TEXT:
                this.queryText(this.getValue());
                break;

            case SearchBar.MODE_STRUCTURAL:
                var finder = new CustomMotifFinder(this.graphBuilder.convertToBG());
                this.queryMotif(finder);
                break;

            case SearchBar.MODE_PREDEFINED:
                var value = this.getValue();
                var type = value.trim().match(/^#(?:motif\s*=\s*)?(.*)/i)[1];

                if (type == "request-response") {
                    this.queryMotif(new RequestResponseFinder(999, 4));
                    return;
                } else if (type == "broadcast" || type == "gather") {
                    var broadcast;
                    if (type == "broadcast") broadcast = true;
                    else broadcast = false;

                    var hiddenHosts = this.global.getHiddenHosts();

                    this.global.getViews().forEach(function(view) {
                        var hosts = view.getHosts().filter(function(h) {
                            return !hiddenHosts[h];
                        }).length;
                        var finder = new BroadcastGatherFinder(hosts - 1, 4, broadcast);

                        view.getTransformer().highlightMotif(finder, false);
                    });

                    this.global.drawAll();
                } else {
                    throw new Exception(type + " is not a built-in motif type", true);
                }

                break;

            default:
                throw new Exception("SearchBar.prototype.query: invalid mode");
                break;
        }
    }
    catch (e) {
        Shiviz.getInstance().handleException(e);
    }
};

/**
 * Performs a text query
 * 
 * @param {String} query the query string
 */
SearchBar.prototype.queryText = function(query) {
    var finder = new TextQueryMotifFinder(query);
    this.global.getViews().forEach(function(view) {
        view.getTransformer().highlightMotif(finder, false);
    });
    this.global.drawAll();
};

/**
 * Performs a query for a motif
 * 
 * @param {MotifFinder} finder A motif finder
 */
SearchBar.prototype.queryMotif = function(finder) {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().highlightMotif(finder, false);
    });
    this.global.drawAll();
};