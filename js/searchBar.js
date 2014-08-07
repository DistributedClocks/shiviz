function SearchBarController() {

    var context = this;

    $("#searchInput").keypress(function(e) {
        try {
            if (e.which == 13) {
                var text = $("#searchInput").val();
                context.query(text);
            }
        }
        catch (exception) {
            Shiviz.getInstance().handleException(exception);
        }
    });

    $("#searchInput").focus(function() {
        $("#searchDropdown").show();
        $("#searchCover").show();
    });

    $("#searchCover").on("click", function() {
        $("#searchDropdown").hide();
        $("#searchCover").hide();
    });

    this.highlightTransformation = null;
}

SearchBarController.instance = null;

SearchBarController.getInstance = function() {
    return this.instance;
};

SearchBarController.prototype.setWidth = function(width) {
    $("#searchBar").outerWidth(width);
    $("#searchDropdown").outerWidth(width);
    
    $("#searchDropdown").outerHeight(1000);
};

SearchBarController.prototype.query = function(queryText) {
    var context = this;

    if (this.highlightTransformation != null) {
        this.transformers.forEach(function(transformer) {
            transformer.removeTransformation(context.highlightTransformation);
        });
    }

    this.highlightTransformation = new HighlightMotifTransformation(new TextQueryMotifFinder(queryText), false);

    this.transformers.forEach(function(transformer) {
        transformer.addTransformation(context.highlightTransformation);
    });

    this.transform();
    this.global.drawAll();
};