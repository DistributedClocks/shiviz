function SearchBar(global) {
    
    this.global = global;
    this.graphBuilder = new GraphBuilder(this);

    // Temporary flag until serialization is implemented
    this.searchMotif = false;
    
    var context = this;

    $("#searchbar #bar input").on("keydown", function(e) {
        try {
            if (e.which == 13 && (this.value.length || context.searchMotif)) {
                $("#searchbar #bar button").click();
            }
        } catch (exception) {
            Shiviz.getInstance().handleException(exception);
        }
    }).on("input", function() {
        if (this.value.length)
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
            if (context.searchMotif) {
                var bg = context.graphBuilder.convertToBG();
                context.query(bg);
            } else {
                var text = $("#searchbar #bar input").val();
                context.query(text);
            }

            context.hide();
        } catch (exception) {
            Shiviz.getInstance().handleException(exception);
        }
    });

}

SearchBar.prototype.hide = function() {
    $("#bar input").blur().removeClass("focus");
    $("#searchbar #panel").hide();
    $(window).unbind("mousedown");
};

SearchBar.prototype.clearMotif = function() {
    for (var i = hosts.length - 1; i > 1; i--)
        hosts[i].remove();

    for (var i = nodes.length - 1; i > -1; i--)
        nodes[i].remove();
};

SearchBar.prototype.clearText = function() {
    $("#bar input").val("");
};

SearchBar.prototype.clear = function() {
    this.clearText();
    this.clearMotif();
};

SearchBar.prototype.notify = function(n) {
    if (n == 0) {
        $("#bar button").prop("disabled", true);
        this.searchMotif = false;
    } else {
        $("#bar button").prop("disabled", false);
        this.searchMotif = true;
        this.clearText();
    }
}

SearchBar.prototype.query = function(query) {

    if (typeof query == "string") {
        var finder = new TextQueryMotifFinder(query);
    } else if (query instanceof BuilderGraph) {
        var finder = new CustomMotifFinder(query);
    }

    var views = this.global.getViews();
    views.forEach(function(view) {
        view.getTransformer().highlightMotif(finder, false);
    });
    
    this.global.drawAll();
};