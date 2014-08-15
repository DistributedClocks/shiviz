function SearchBar(global) {

    this.global = global;
    this.graphBuilder = new GraphBuilder(this);

    window.graphBuilder = this.graphBuilder;

    this.mode = SearchBar.MODE_EMPTY;

    var context = this;

    $("#searchbar #bar input").on("keydown", function(e) {
        try {
            if (e.which == 13) {
                $("#searchbar #bar button").click();
            }
        }
        catch (exception) {
            Shiviz.getInstance().handleException(exception);
        }
    }).on("input", function() {

        context.graphBuilder.lockConversion();
        context.updateMode();

        if (context.mode == SearchBar.MODE_EMPTY) {
            context.clearMotif();
        }
        else if (context.mode == SearchBar.MODE_TEXT) {
            context.clearMotif();
        }
        else if (context.mode == SearchBar.MODE_STRUCTURAL) {
            try {
                var match = this.value.trim().match(/^#(motif\s*=\s*)?(\[.*\])/i);
                var json = match[2];
                JSON.parse(json);
                var parsingRegex = new NamedRegExp("(?<event>)\\{\\\"host\\\":\\\"(?<host>[^\\}]+)\\\",\\\"clock\\\":(?<clock>\\{[^\\}]*\\})\\}", "i");
                var parser = new LogParser(json, null, parsingRegex);
                var logEvents = parser.getLogEvents(parser.getLabels()[0]);
                var vectorTimestamps = logEvents.map(function(logEvent) {
                    return logEvent.getVectorTimestamp();
                });
                var builderGraph = BuilderGraph.fromVectorTimestamps(vectorTimestamps);
                context.graphBuilder.convertFromBG(builderGraph);
            }
            catch (exception) {
                //                throw new Exception("ASDF", true);
            }
        }
        else {
            //TODO
            console.log("OMFG");
        }

        $("#searchbar #bar button").click();
        context.graphBuilder.unlockConversion();

        if (this.value.trim().length)
            $("#bar button").prop("disabled", false);
        else
            $("#bar button").prop("disabled", true);
    }).on("focus", function() {
        $(this).addClass("focus");
        $("#searchbar #panel").show();
        $(window).on("mousedown", function(e) {
            var $target = $(e.target);
            if (!$target.parents("#searchbar").length)
                context.hide();
        });
    });

    $("#searchbar #bar button").on("click", function() {
        try {
            context.updateMode();

            if (context.mode == SearchBar.MODE_EMPTY) {
                context.clearResults();
                return;
            }
            else if (context.mode == SearchBar.MODE_STRUCTURAL) {
                context.queryMotif(context.graphBuilder.convertToBG());
            }
            else if (context.mode == SearchBar.MODE_TEXT) {
                context.queryText($("#searchbar #bar input").val());
            }
            else {
                console.log("ASDSDA"); //TODO
            }

            // context.hide();
        }
        catch (exception) {
            // Shiviz.getInstance().handleException(exception);
        }
    });

    $("#searchbar #bar .clear").on("click", function() {
        context.graphBuilder.lockConversion();
        context.clear();
        $("#searchbar #bar input").focus();
        context.graphBuilder.unlockConversion();
    });
}

SearchBar.MODE_EMPTY = 0;
SearchBar.MODE_STRUCTURAL = 1;
SearchBar.MODE_TEXT = 2;

SearchBar.prototype.updateMode = function() {
    var value = $("#searchbar #bar input").val();

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
        this.mode = SearchBar.MODE_STRUCTURAL;
        console.log("OMFG");
    }
};

SearchBar.prototype.hide = function() {
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
}

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

SearchBar.prototype.notify = function() {
    $("#searchbar #bar button").click();
}