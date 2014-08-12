function SearchBar() {
    var context = this;

    $("#searchbar #bar input").on("keydown", function(e) {
        try {
            if (e.which == 13 && (this.value.length || nodes.length)) {
                if (nodes.length) {
                    var bg = convertToBG();
                    context.query(bg);
                    context.clearMotif();
                } else {
                    var text = this.value;
                    context.query(text);
                }

                context.hide();
            }
        } catch (exception) {
            Shiviz.getInstance().handleException(exception);
        }
    }).on("input", function() {
        if (this.value.length)
            $("#bar button").prop("disabled", false)
        else
            $("#bar button").prop("disabled", true)
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
            var text = $("#bar input").val();
            context.query(text);
            context.hide();
        } catch (exception) {
            Shiviz.getInstance().handleException(exception);
        }
    });

}

SearchBar.instance = new SearchBar();

SearchBar.getInstance = function() {
    return this.instance;
};

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

SearchBar.prototype.query = function(query) {
    var controller = Global.getInstance().getController();

    if (typeof query == "string") {
        var finder = new TextQueryMotifFinder(query);
    } else if (query instanceof BuilderGraph) {
        var finder = new CustomMotifFinder(query);
    }

    var views = Global.getInstance().getViews();
    views.forEach(function(view) {
        view.getTransformer().highlightMotif(finder, false);
    });
    
    Global.getInstance().drawAll();
};