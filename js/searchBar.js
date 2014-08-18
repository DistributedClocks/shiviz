function SearchBar(global) {

    this.global = global;
    this.graphBuilder = new GraphBuilder(this);
    this.mode = SearchBar.MODE_EMPTY;

    var context = this;

    $("#searchbar #bar input").on("keydown", function(e) {
        if (e.which == 13)
            context.query();
    }).on("input", function() {
        context.update();
        context.query(true);
    }).on("focus", function() {
        context.showPanel();
    });

    $("#searchbar #bar button").on("click", function() {
        context.query();
    });

    $("#searchbar #bar .clear").on("click", function() {
        context.graphBuilder.lockConversion();
        context.clear();
        context.update();
        context.graphBuilder.unlockConversion();

        $("#searchbar #bar input").focus();
    });

    this.update();
}

SearchBar.MODE_EMPTY = 0;
SearchBar.MODE_TEXT = 1;
SearchBar.MODE_STRUCTURAL = 2;
SearchBar.MODE_PREDEFINED = 3;

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

SearchBar.prototype.update = function() {
    var value = this.getValue();

    this.graphBuilder.lockConversion();
    this.updateMode();

    switch (this.mode) {

        // Empty
        case SearchBar.MODE_EMPTY:
        this.clearMotif();

        $("#bar button").prop("disabled", true);
        $("#searchbar .clear").hide();
        break;

        // Not empty
        case this.mode:
        $("#bar button").prop("disabled", false);
        $("#searchbar .clear").show();

        // Text
        case SearchBar.MODE_TEXT:
        this.clearMotif();
        break;

        // Motif (custom)
        case SearchBar.MODE_STRUCTURAL:
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
        break;

        default:
        break;
    }

    this.graphBuilder.unlockConversion();
}

SearchBar.prototype.getValue = function() {
    return $("#searchbar #bar input").val();
};

SearchBar.prototype.setValue = function(val) {
    $("#searchbar #bar input").val(val);
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
    $("#bar input").val("");
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

SearchBar.prototype.query = function(safe) {
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
        if (safe) return;
        else throw e;
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