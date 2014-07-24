/**
 * Constructs a new Shiviz object. As Shiviz is a singleton, do not call this
 * constructor directly. This constructor is the "entry-point" for the
 * application. That is, this is the first function to run on Shiviz's startup.
 * 
 * @classdesc
 * 
 * Shiviz is the class responsible for "global" application level aspects of the
 * software. For example, this class is responsible for binding handlers to
 * shiviz's various global UI elements. Shiviz is a singleton
 * 
 * @private
 * @constructor
 */
function Shiviz() {

    if (!!Shiviz.instance) {
        throw new Exception("Cannot instantiate Shiviz. Shiviz is a singleton; use Shiviz.getInstance()");
    }

    var context = this;

    $(".input input, .input textarea").on('input propertychange', function(e) {
        context.resetView();
    });

    $("#examples a").on("click", function(e) {
        e.preventDefault();

        // logUrlPrefix is defined in dev.js & deployed.js
        var url = logUrlPrefix + $(this).data("log");
        var defaultParser = "(?<event>.*)\\n(?<host>\\S*) (?<clock>{.*})";

        $.get(url, function(response) {
            $("#input").val(response);
            context.resetView();
            $("#delimiter").val($(e.target).data("delimiter"));
            $("#parser").val($(e.target).data("parser") || defaultParser);
            $(e.target).css({
                color: "gray",
                pointerEvents: "none"
            });

        }).fail(function() {
            Shiviz.getInstance().handleException(new Exception("Unable to retrieve example log from: " + url, true));
        });
    });

    $(".tabs li").on("click", function() {
        context.go($(this).index(), true);
    });

    $(".try").on("click", function() {
        context.go(1, true);
    });

    $("#errorcover").on("click", function() {
        $(".error").hide();
    });

    // Listener for history popstate
    $(window).on("popstate", function(e) {
        context.go(e.originalEvent.state == null ? 0 : e.originalEvent.state.index, false);
    });

    $("#versionContainer").html(versionText);

    $("#visualize").on("click", function() {
        context.go(2, true, true);
    });
}

/**
 * @private
 * @static
 */
Shiviz.instance = null;

/**
 * Gets the instance of the Shiviz singleton
 * 
 * @returns {Shiviz} The singleton instance
 */
Shiviz.prototype.getInstance = function() {
    return Shiviz.instance;
};

/**
 * Resets the visualization.
 */
Shiviz.prototype.resetView = function() {
    // Enable/disable the visualize button depending on whether or not
    // the text area is empty.
    if ($("#input").val() == "") {
        $("#visualize").prop("disabled", true);
        $(".icon .tabs li:last-child").addClass("disabled");
    }
    else {
        $("#visualize").prop("disabled", false);
        $(".icon .tabs li:last-child").removeClass("disabled");
    }

    $(".event").text("(click to view)");
    $(".fields").html("");

    d3.selectAll("#graph svg").remove();

    // Reset the color of all of the log-links.
    $(".log-link").css({
        "color": "",
        "pointer-events": "initial"
    });
};

/**
 * This method creates the visualization. The user's input to UI elements are retrieved and used
 * to construct the visualization accordingly.
 */
Shiviz.prototype.visualize = function() {
    try {
        d3.selectAll("#graph svg").remove();

        var log = $("#input").val();
        var delimiterString = $("#delimiter").val().trim();
        var delimiter = delimiterString == "" ? null : new NamedRegExp(delimiterString, "m");
        var regexpString = $("#parser").val().trim();

        if (regexpString == "")
            throw new Exception("The parser regexp field must not be empty.", true);

        var regexp = new NamedRegExp(regexpString, "m");
        var parser = new LogParser(log, delimiter, regexp);

        var sortType = $("input[name=host_sort]:checked").val().trim();
        var descending = $("#ordering option:selected").val().trim() == "descending";
        var hostPermutation = null;

        if (sortType == "length") {
            hostPermutation = new LengthPermutation(descending);
        } else if (sortType == "order") {
            hostPermutation = new LogOrderPermutation(descending);
        } else {
            throw new Exception("You must select a way to sort processes.", true);
        }

        var global = new Global(hostPermutation);
        var labelGraph = {};

        var labels = parser.getLabels();
        labels.forEach(function(label) {
            var graph = new ModelGraph(parser.getLogEvents(label));
            labelGraph[label] = graph;

            hostPermutation.addGraph(graph);
            if (sortType == "order") {
                hostPermutation.addLogs(parser.getLogEvents(label));
            }
        });
        
        hostPermutation.update();

        labels.forEach(function(label) {
            var graph = labelGraph[label];
            var view = new View(graph, global, hostPermutation, label);
            global.addView(view);
        });

        global.drawAll();
    } catch (err) {
        this.handleException(err);
    }
};

/**
 * Navigates to tab index and pushes history state to browser so user can use
 * back button to navigate between tabs.
 * 
 * @param {Integer} index The index of the tab: 0 of home, 1 for input, 2 for
 *        visualization
 * @param {Boolean} store Whether or not to store the history state
 * @param {Boolean} force Whether or not to force redrawing of graph
 */
Shiviz.prototype.go = function(index, store, force) {
    $("section").hide();
    $(window).scrollTop();
    switch (index) {
    case 0:
        $(".home").show();
        break;
    case 1:
        $(".input").show();
        inputHeight();
        $(window).on("load resize", inputHeight);
        break;
    case 2:
        $(".visualization").show();
        if (!$("#graph svg").length || force)
            this.visualize();
        break;
    }

    if (store)
        history.pushState({
            index: index
        }, null, null);

    function inputHeight() {
        $(".input #input").outerHeight(0);

        var bodyPadding = parseFloat($("body").css("padding-top")) * 2;
        var exampleHeight = $("#examples").outerHeight();
        var fillHeight = $(window).height() - bodyPadding - exampleHeight;
        var properHeight = Math.max($(".input .left").height(), fillHeight);

        $(".input #input").outerHeight(properHeight);
    }
};

/**
 * <p>
 * Handles an {@link Exception} appropriately.
 * </p>
 * 
 * <p>
 * If the exception is {@link Exception#isUserFriendly user friendly}, its
 * message is displayed to the user in an error box. Otherwise, a generic error
 * message is presented to the user and the exception's message is logged to
 * console. If the argument is not an {@link Exception}, it is thrown.
 * </p>
 * 
 * @private
 * @param {Exception} err the Exception to handle
 */
Shiviz.prototype.handleException = function(err) {
    if (err.constructor != Exception) {
        throw err;
    }

    var errhtml = err.getHTMLMessage();

    if (!err.isUserFriendly()) {
        console.log(err.getMessage());
        errhtml = "An unexpected error was encountered. Sorry!";
    }

    $("#errorbox").html(errhtml);
    $(".error").show();

    // Let users close errors with esc
    $(window).on('keydown', function(e) {
        if (e.keyCode == 27) {
            $(".error").hide();
            $(window).unbind('keydown');
        }
    });

    this.go(1);
};

$(document).ready(function() {
    Shiviz.instance = new Shiviz();
});