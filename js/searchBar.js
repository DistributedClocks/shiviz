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
    this.graphBuilder = new GraphBuilder(this);

    /** @private */
    this.mode = SearchBar.MODE_EMPTY;

    var context = this;

    $(window).unbind("keydown").on("keydown", function(e) {
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

    $("#searchbar #bar button").on("click", function() {
        context.query();
        context.hidePanel();
    });

    $("#searchbar #bar .clear").on("click", function() {
        context.graphBuilder.lockConversion();
        context.clear();
        context.hidePanel();
        context.update();
        context.graphBuilder.unlockConversion();
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

    if (value.trim().length == 0) {
        this.mode = SearchBar.MODE_EMPTY;
    }
    else if (value.indexOf("#") < 0) {
        this.mode = SearchBar.MODE_TEXT;
    }
    else if (value.trim().match(/^#(motif\s*=\s*)?(\[.*\])/i) != null) {
        this.mode = SearchBar.MODE_STRUCTURAL;
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
 * 
 * @param {Boolean} skipRegen This does something albert should explain
 */
SearchBar.prototype.update = function(skipRegen) {
    var value = this.getValue();

    this.graphBuilder.lockConversion();
    this.updateMode();

    switch (this.mode) {

        // Empty
        case SearchBar.MODE_EMPTY:
            this.clearMotif();

            $("#bar button").prop("disabled", true);
            $("#searchbar input").addClass("empty");
            break;

        // Text
        case SearchBar.MODE_TEXT:
            this.clearMotif();
            break;

        // Motif (custom)
        case SearchBar.MODE_STRUCTURAL:
            if (!skipRegen) {
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
            break;

        default:
            throw new Exception("Invalid mode in SearchBar");
            break;
    }

    if (this.mode != SearchBar.MODE_EMPTY) {
        $("#bar button").prop("disabled", false);
        $("#searchbar input").removeClass("empty");
    }

    this.graphBuilder.unlockConversion();
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

    if (this.mode != SearchBar.MODE_EMPTY)
        $("#searchbar input").removeClass("empty");
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
    this.clearText();
    this.clearMotif();
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
                this.queryMotif(this.graphBuilder.convertToBG());
                break;

            case SearchBar.MODE_PREDEFINED:
                // TODO: Predefined motifs
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
 * @param {BuilderGraph} builderGraph The motif structure
 */
SearchBar.prototype.queryMotif = function(builderGraph) {
    var finder = new CustomMotifFinder(builderGraph);
    this.global.getViews().forEach(function(view) {
        view.getTransformer().highlightMotif(finder, false);
    });
    this.global.drawAll();
};