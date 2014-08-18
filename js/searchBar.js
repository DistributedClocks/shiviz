function SearchBar() {

    if (SearchBar.instance)
        throw new Exception("Cannot instantiate SearchBar, instance already exists");

    SearchBar.instance = this;

    this.global = null;
    this.graphBuilder = new GraphBuilder(this);
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

SearchBar.MODE_EMPTY = 0;
SearchBar.MODE_TEXT = 1;
SearchBar.MODE_STRUCTURAL = 2;
SearchBar.MODE_PREDEFINED = 3;

SearchBar.instance = null;

SearchBar.getInstance = function() {
    return SearchBar.instance || new SearchBar();
};

SearchBar.prototype.setGlobal = function(global) {
    this.global = global;
};

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
        break;
    }

    if (this.mode != SearchBar.MODE_EMPTY) {
        $("#bar button").prop("disabled", false);
        $("#searchbar input").removeClass("empty");
    }

    this.graphBuilder.unlockConversion();
}

SearchBar.prototype.getValue = function() {
    return $("#searchbar #bar input").val();
};

SearchBar.prototype.setValue = function(val) {
    $("#searchbar #bar input").val(val);

    if (this.mode != SearchBar.MODE_EMPTY)
        $("#searchbar input").removeClass("empty");
};

SearchBar.prototype.isPanelShown = function() {
    return $("#searchbar #panel:visible").length;
};

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

SearchBar.prototype.hidePanel = function() {
    $("#bar input").blur().removeClass("focus");
    $("#searchbar #panel").hide();
    $(window).unbind("mousedown");
};

SearchBar.prototype.clearMotif = function() {
    this.graphBuilder.clear();
};

SearchBar.prototype.clearText = function() {
    this.setValue("");
};

SearchBar.prototype.clear = function() {
    this.clearText();
    this.clearMotif();
    this.clearResults();
};

SearchBar.prototype.clearResults = function() {
    this.global.getViews().forEach(function(view) {
        view.getTransformer().unhighlightMotif();
    });
    this.global.drawAll();
};

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
            break;
        }
    } catch (e) {
        Shiviz.getInstance().handleException(e);
    }
};

SearchBar.prototype.queryText = function(query) {
    var finder = new TextQueryMotifFinder(query);
    this.global.getViews().forEach(function(view) {
        view.getTransformer().highlightMotif(finder, false);
    });
    this.global.drawAll();
};

SearchBar.prototype.queryMotif = function(builderGraph) {
    var finder = new CustomMotifFinder(builderGraph);
    this.global.getViews().forEach(function(view) {
        view.getTransformer().highlightMotif(finder, false);
    });
    this.global.drawAll();
};