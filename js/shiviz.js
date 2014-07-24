$(".input input, .input textarea").on('input propertychange', function(e) {
    resetView();
});

$("#examples a").on("click", function(e) {
    e.preventDefault();

    // logUrlPrefix is defined in dev.js & deployed.js
    var url = logUrlPrefix + $(this).data("log");
    var defaultParser = "(?<event>.*)\\n(?<host>\\S*) (?<clock>{.*})";

    $.get(url, function(response) {
        $("#input").val(response);
        resetView();
        $("#delimiter").val($(e.target).data("delimiter"));
        $("#parser").val($(e.target).data("parser") || defaultParser);
        $(e.target).css({
            color: "gray",
            pointerEvents: "none"
        });
    }).fail(function() {
        throw new Exception("Unable to retrieve example log from: " + url, true);
    });
});

$(".tabs li").on("click", function () {
    go($(this).index(), true);
});

$(".try").on("click", function () {
    go(1, true);
});

$("#errorcover").on("click", function () {
    $(".error").hide();
});

// Listener for history popstate
$(window).on("popstate", function (e) {
    go(e.originalEvent.state == null ? 0 : e.originalEvent.state.index, false);
});

$("#versionContainer").html(versionText);

// variables to store last node in a process
var lastNodesElements = {};
// variable to store original colours
var hostColors = {};
// variables to store the id attached to each process box
var hosts = {};

function resetView() {
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

$("#visualize").on("click", function () {
    go(2, true, true);
});

function visualize() {
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
        
        var labels = parser.getLabels();
        for (var i = 0; i < labels.length; i++) {
            var label = labels[i];
            var graph = new ModelGraph(parser.getLogEvents(label));
            var view = new View(graph, global, hostPermutation, label);

            hostPermutation.addGraph(graph);
            global.addView(view);

            if (sortType == "order") {
                hostPermutation.addLogs(parser.getLogEvents(label));
            }
        }
    
        hostPermutation.update();
        global.drawAll();
    }
    catch(err) {
        handleError(err);
    }
};

/**
 * returns the last node associated with a certain process id
 * 
 * @param String hostid
 */
function getLastNodeElementOfHost(hostid) {
    var htmlElem;
    htmlElem = $("g").filter(function() {
        if ($(this).find("title").text() == lastNodesId[hostid]["logEvent"]) {
            return this;
        }
    });
    return htmlElem;
};

/**
 * creates an object with the process (host) id as the key and the last node
 * associated with the process as the value
 */
function createLastNodeElements() {
    lastNodesElements = {};
    for (var i = 0; i < hosts.length; i++) {
        lastNodesElements[hosts[i]] = getLastNodeElementOfHost(hosts[i]);
    }
}

/**
 * Navigates to tab index and pushes history state to browser
 * so user can use back button to navigate between tabs.
 * 
 * @param  {Number} index The index of the tab: 0 of home, 1 for
 *                        input, 2 for visualization
 * @param  {Boolean} store Whether or not to store the history state
 * @param  {Boolean} force Whether or not to force redrawing of graph
 */
function go(index, store, force) {
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
            visualize();
        break;
    }

    if (store)
        history.pushState({index: index}, null, null);
}

function inputHeight() {
    $(".input #input").outerHeight(0);

    var bodyPadding = parseFloat($("body").css("padding-top")) * 2;
    var exampleHeight = $("#examples").outerHeight();
    var fillHeight = $(window).height() - bodyPadding - exampleHeight;
    var properHeight = Math.max($(".input .left").height(), fillHeight);

    $(".input #input").outerHeight(properHeight);
}

function handleError(err) {
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

    go(1);
}