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
 * @constructor
 */
function Shiviz() {

    if (!!Shiviz.instance) {
        throw new Exception("Cannot instantiate Shiviz. Shiviz is a singleton; use Shiviz.getInstance()");
    }

    var context = this;
    var defaultParser = "(?<event>.*)\\n(?<host>\\S*) (?<clock>{.*})";
    var defaultOrdering = "descending";
    var defaultHostSort = "#hostsortLength";

    $(".input input, .input textarea").on('input propertychange', function(e) {
        context.resetView();
    });

    $("#examples a").on("click", function(e) {
        e.preventDefault();

        // logUrlPrefix is defined in dev.js & deployed.js
        var prefix = "/shiviz/log/";
        var logName = $(this).data("log");
        var url = prefix + logName;

        $.get(url, function(response) {
            handleResponse(response, e);
        }).fail(function() {
            prefix = "https://api.github.com/repos/bestchai/shiviz-logs/contents/";
            url = prefix + logName;

            $.get(url, function(response) {
                response = atob(response.content);
                handleResponse(response, e);
            }).fail(function() {
                Shiviz.getInstance().handleException(new Exception("unable to retrieve example log from: " + url, true));
            });  
        });
    });

    function handleResponse(response, e) {
        $("#input").val(response);
        context.resetView();
        $("#delimiter").val($(e.target).data("delimiter"));
        $("#parser").val($(e.target).data("parser") || defaultParser);
        $("#ordering").val($(e.target).data("ordering") || defaultOrdering);
        $($(e.target).data("hostsort") || defaultHostSort).prop("checked", true);
        // Clears the file input value by replacing the file input component with a clone
        $("#file").replaceWith($("#file").clone(true));

        $(e.target).css({
            color: "gray",
            pointerevents: "none"
        });

        // Triggers change event for example-hash listener
        $("#input").change();
    }

    $(".tabs li").on("click", function() {
        context.go($(this).index(), true);
    });

    $(".try").on("click", function() {
        context.go(1, true);
    });

    $("#errorcover").on("click", function() {
        $(".error").hide();
    });

    $(".input #hostsortLength, .input #hostsortOrder").on("click", function() {
        d3.selectAll("#vizContainer svg").remove();        
    });

    // Listener for history popstate
    $(window).on("popstate", function(e) {
        context.go(e.originalEvent.state == null ? 0 : e.originalEvent.state.index, false);
    });

    $("#versionContainer").html(versionText);

    $("#visualize").on("click", function() {
        context.go(2, true, true);
    });
    
    // Clears the file input value whenever 'Choose File' is clicked
    $("#file").on("click", function() {
       this.value = "";
    });
    
    $("#file").on("change", function(e) {
    
       var file = e.target.files[0];
       var reader = new FileReader();
       
       reader.onload = function(e) {   
          // Get the text string containing the file's data
          var text = reader.result;
          // Split the text string by the new line character 
          // to get the first 2 lines as substrings in an array
          var lines = text.split("\n",2);
          
          var defaultOrdering = "descending";
         
          // If the first line is not empty and not just white space, 
          // set it as the 'log parsing regular expression' value.
          // Otherwise, use the default log parsing regular expression
          if (lines[0].trim()) { $("#parser").val(lines[0]);}
          else { $("#parser").val(defaultParser);}
          
          // Set the 'multiple executions regular expression delimiter' field
          // to the second line and set the ordering of the processes to descending
          $("#delimiter").val(lines[1].trim());
          $("#ordering").val(defaultOrdering);
          
          // Get the position of the new line character that occurs at the end of the second line
          var startOfLog = text.indexOf("\n", (text.indexOf("\n")) + 1);
          // The log will start at the position above + 1; 
          // fill in the log text area with the rest of the lines of the file
          $("#input").val(text.substr(startOfLog + 1));
          
          context.resetView();
          $("#visualize").click();
          
          // Clears the file input value whenever the log text area or regular expression
          // fields are modified
          $("#input, #parser, #delimiter").on("input", function() {
             $("#file").replaceWith($("#file").clone(true));
          });
       }
       
       reader.readAsText(file);
    });

    if (window.location.hash) {
        $("#input").bind("change.hash", function () {
            $("#input").unbind("change.hash");
            $("#visualize").click();
        });
        var log = window.location.hash.substr(1) + ".log";
        $("#examples a[data-log=\"" + log + "\"]").click();
    }
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
Shiviz.getInstance = function() {
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
    $(".event").text("");
    $(".fields").html("");

    d3.selectAll("#vizContainer svg").remove();

    // Reset the color of all of the log-links.
    $(".log-link").css({
        "color": "",
        "pointer-events": "initial"
    });
};

/**
 * This method creates the visualization. The user's input to UI elements are
 * retrieved and used to construct the visualization accordingly.
 */
Shiviz.prototype.visualize = function(log, regexpString, delimiterString, sortType, descending) {
    try {
        d3.selectAll("#vizContainer svg").remove();

        delimiterString = delimiterString.trim();
        var delimiter = delimiterString == "" ? null : new NamedRegExp(delimiterString, "m");
        regexpString = regexpString.trim();

        if (regexpString == "")
            throw new Exception("The parser regexp field must not be empty.", true);

        var regexp = new NamedRegExp(regexpString, "m");
        var parser = new LogParser(log, delimiter, regexp);

        var hostPermutation = null;

        if (sortType == "length") {
            hostPermutation = new LengthPermutation(descending);
        }
        else if (sortType == "order") {
            hostPermutation = new LogOrderPermutation(descending);
        }
        else {
            throw new Exception("You must select a way to sort processes.", true);
        }

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

        var views = [];
        
        for(var i = 0; i < labels.length; i++) {
            var label = labels[i];
            
            var graph = labelGraph[label];
            var view = new View(graph, hostPermutation, label);
            views.push(view);
        }
        
        // initial properties for the diffButton
        $(".diffButton").hide();
        $(".diffButton").text("Show Differences");
        $(".diffButton").removeClass("fade");

        // initial properties for the pairwiseButton
        $(".pairwiseButton").hide();
        $(".pairwiseButton").text("Pairwise");
        $(".pairwiseButton").removeClass("fade");

        // reset search tabs
        $("#textTab").show().siblings("div").hide();
        $(".searchTabLinks li").first().addClass("default").siblings("li").removeClass("default");

        // reset left sidebar tabs
        $(".leftTabLinks").children().hide();
        $(".leftTabLinks li").not(":last").show();
        $(".leftTabLinks li").first().addClass("default").siblings().removeClass("default");
        $("#logTab").show().siblings().hide();

        // Reset the motifs tab
        $(".motifResults td").empty();
        $(".motifResults td:empty").remove();
        $("#motifOption input").prop("checked", false);

        if (views.length > 1) {
            // Show and clear the Clusters tab
            $(".leftTabLinks li").last().show();
            $(".clusterResults td.lines").empty();
            $(".clusterResults td:empty").remove();
            $("#baseLabel, .clusterBase").hide();
            $("#clusterIconL, #clusterIconR").remove();
            $("#clusterOption input").prop("checked", false);
        }

        var global = new Global($("#vizContainer"), $("#sidebar"), $("#hostBar"), $("table.log"), views);
        var searchbar = SearchBar.getInstance();
        searchbar.setGlobal(global);
        SearchBar.getInstance().clear();

        global.setHostPermutation(hostPermutation);
        global.drawAll();
    }
    catch (err) {
        this.handleException(err);
    }
};

/**
 * Navigates to tab index and pushes history state to browser so user can use
 * back button to navigate between tabs.
 * 
 * @param {Integer} index The index of the tab: 0 of home, 1 for input, 2 for
 *            visualization
 * @param {Boolean} store Whether or not to store the history state
 * @param {Boolean} force Whether or not to force redrawing of graph
 */
Shiviz.prototype.go = function(index, store, force) {
    switch (index) {
        case 0:
            $("section").hide();
            $(window).scrollTop();
            $(".home").show();
            break;
        case 1:
            $("section").hide();
            $(window).scrollTop();
            $(".input").show();
            inputHeight();
            $(window).on("load resize", inputHeight);
            break;
        case 2:
            $(".visualization").show();
            try {
                if (!$("#vizContainer svg").length || force)
                    this.visualize($("#input").val(), $("#parser").val(),  $("#delimiter").val(), $("input[name=host_sort]:checked").val().trim(), $("#ordering option:selected").val().trim() == "descending");
            } catch(e) {
                $(".visualization").hide();
                throw e;
            }

            $("section:not(.visualization)").hide();
            $(window).scrollTop();
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
        errhtml = "An unexpected error was encountered. Sorry!";
    }

    $("#errorbox").html(errhtml);
    $(".error").show();

    // Let users close errors with esc
    $(window).on('keydown.error', function(e) {
        if (e.keyCode == 27) {
            $(".error").hide();
            $(window).unbind('keydown.error');
        }
    });

    throw new Error(err.getMessage());
};

$(document).ready(function() {
    Shiviz.instance = new Shiviz();
});