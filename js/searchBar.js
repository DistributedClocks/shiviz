function SearchBar() {
    var context = this;

    $("#searchbar #bar input").on("keydown", function(e) {
        try {
            if (e.which == 13) {
                var text = this.value;
                context.query(text);
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

    this.highlightTransformation = null;
    this.global = null;
}

SearchBar.instance = null;

SearchBar.getInstance = function() {
    return this.instance;
};

SearchBar.prototype.hide = function() {
    $("#bar input").blur().removeClass("focus");
    $("#searchbar #panel").hide();
    $(window).unbind("mousedown");
}

SearchBar.prototype.setGlobal = function(global) {
    this.global = global;
}

SearchBar.prototype.query = function(queryText) {
    var context = this;
    var controller = this.global.getController();

    if (this.highlightTransformation != null) {
        controller.transformers.forEach(function(transformer) {
            transformer.removeTransformation(context.highlightTransformation, true);
        });
    }

    this.highlightTransformation = new HighlightMotifTransformation(new TextQueryMotifFinder(queryText), false);

    controller.transformers.forEach(function(transformer) {
        transformer.addTransformation(context.highlightTransformation, true);
    });

    controller.transform();
    this.global.drawAll();
};