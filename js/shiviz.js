// an alternative to the above commented out code. This resolves issue 18
// and prevents the innocuos keys such as 'ctrl' from resetting the view
$("#logField").on('input propertychange', function(e) {
    resetView();
});

$("#examplelogs a").on("click", function(e) {
    e.preventDefault();

    // logUrlPrefix is defined in dev.js & deployed.js
    var url = logUrlPrefix + $(this).data("log");
    $.get(url, function(response) {
        $("#logField").val(response);
        resetView();
        $("#delimiter").val($(e.target).data("delimiter"))
        $(e.target).css({ color: "gray", pointerEvents: "none" });
    }).fail(function() {
        var errText = 'Unable to retrieve example log: ' + url;
        console.log(errText);
        alert(errText);
    });
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
    if ($("#logField").val() == "") {
        $("#vizButton").prop("disabled", true);
    }
    else {
        $("#vizButton").prop("disabled", false);
    }

    $("#curNode").html("(click to view)");
    $("#graph").hide();

    d3.selectAll("svg").remove();

    // Reset the color of all of the log-links.
    $(".log-link").css({
        "color": "",
        "pointer-events": "initial"
    });
};

$("#vizButton").on("click", function() {
    d3.selectAll("svg").remove();

    var log = $("#logField").val();
    var labels = null;
    if ($("#delimiter").val().length > 0) {
        var delimiter = new NamedRegExp($("#delimiter").val(), "m");
        var executions = log.split(delimiter.no);
        if (delimiter.names.indexOf("trace") >= 0) {
            labels = [""];
            var match;
            while (match = delimiter.exec(log))
                labels.push(match.trace);
        }
    } else {
        executions = [log];
    }

    executions = executions.filter(function (e, i) {
        if (e.trim().length == 0) {
            if (labels) labels[i] = "//REMOVE";
            return false;
        }
        return true;
    });

    if (!!labels)
        labels = labels.filter(function (e) {
            return !(e == "//REMOVE");
        });

    // We need a variable share across all views/executions to keep them in
    // sync.
    var global = new Global(); //Global.getInstance();

    // Make a view for each execution, then draw it
    executions.map(function (v, i) {
        var lines = v.split('\n');
        var model = generateGraphFromLog(lines);
        var view = new View(model, global, labels ? labels[i] : "");

        global.addView(view);

        return view;
    });
    
    global.drawAll();

    $("#graph").show();

});


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

function selectTextareaLine(tarea, lineNum) {
    var lineLength = 131;
    var lines = tarea.value.split("\n");
    var numLines = 0;
    
    // calculate start/end
    var startPos = 0;
    for (var x = 0; x < lines.length; x++) {
        if (x == lineNum) {
            break;
        }
        startPos += (lines[x].length + 1);
        numLines += Math.ceil(lines[x].length / lineLength);
    }

    tarea.scrollTop = numLines * 13 - 20;
    var endPos = lines[lineNum].length + startPos;

    // do selection
    // Chrome / Firefox

    if (typeof (tarea.selectionStart) != "undefined") {
        tarea.focus();
        tarea.selectionStart = startPos;
        tarea.selectionEnd = endPos;
        return true;
    }

    // IE
    if (document.selection && document.selection.createRange) {
        tarea.focus();
        tarea.select();
        var range = document.selection.createRange();
        range.collapse(true);
        range.moveEnd("character", endPos);
        range.moveStart("character", startPos);
        range.select();
        return true;
    }

    return false;
}
