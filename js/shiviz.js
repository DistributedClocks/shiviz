// an alternative to the above commented out code. This resolves issue 18
// and prevents the innocuos keys such as 'ctrl' from resetting the view
$("#input").on('input propertychange', function(e) {
    resetView();
});

$("#examples a").on("click", function(e) {
    e.preventDefault();

    // logUrlPrefix is defined in dev.js & deployed.js
    var url = logUrlPrefix + $(this).data("log");
    $.get(url, function(response) {
        $("#input").val(response);
        resetView();
        $("#delimiter").val($(e.target).data("delimiter"));
        $(e.target).css({
            color: "gray",
            pointerEvents: "none"
        });
    }).fail(function() {
        var errText = 'Unable to retrieve example log: ' + url;
        console.log(errText);
        alert(errText);
    });
});

$(".tabs li").on("click", function () {
    go($(this).index(), true)
});

$(".try").on("click", function () {
    go(1, true);
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

    $("#curNode").html("(click to view)");

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
        var labels = null;
        if ($("#delimiter").val().length > 0) {
            var delimiter = new NamedRegExp($("#delimiter").val(), "m");
            var executions = log.split(delimiter.no);
            if (delimiter.names.indexOf("trace") >= 0) {
                labels = [ "" ];
                var match;
                while (match = delimiter.exec(log))
                    labels.push(match.trace);
            }
        }
        else {
            executions = [ log ];
        }
    
        executions = executions.filter(function(e, i) {
            if (e.trim().length == 0) {
                if (labels)
                    labels[i] = "//REMOVE";
                return false;
            }
            return true;
        });
    
        if (!!labels)
            labels = labels.filter(function(e) {
                return !(e == "//REMOVE");
            });
    
        // We need a variable share across all views/executions to keep them in
        // sync.
        var global = new Global(); // Global.getInstance();
    
        // Make a view for each execution, then draw it
        executions.map(function(v, i) {
            var lines = v.split('\n');
            var model = generateGraphFromLog(lines);
            var view = new View(model, global, labels ? labels[i] : "");
    
            global.addView(view);
    
            return view;
        });
    
        global.drawAll();
    
        // Check for vertical overflow
        if ($(document).height() > $(window).height())
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
    var exampleHeight = $("#examples").outerHeight()
    var fillHeight = $(window).height() - bodyPadding - exampleHeight;
    var properHeight = Math.max($(".input .left").height(), fillHeight);

    $(".input #input").outerHeight(properHeight);
}


function handleError(err) {
    if(err.constructor != Exception) {
        throw err;
    }
    
    alert(err.getMessage());
//    err.getHTML();
}
