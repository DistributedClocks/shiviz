// an alternative to the above commented out code. This resolves issue 18
// and prevents the innocuos keys such as 'ctrl' from resetting the view
$("#logField").on('input propertychange', function(e) {
    resetView();
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

    var textBox = $("#logField");
    var delimiter = new RegExp($("#delimiter").val(), "m");
    var executions = textBox.val().split(delimiter);

    executions = executions.filter(function (e) {
        return e.trim().length != 0;
    });

    // We need a variable share across all views/executions to keep them in
    // sync.
    var global = new Global();

    // Make a view for each execution, then draw it
    var views = executions.map(function(v) {
        var lines = v.split('\n');
        var model = generateGraphFromLog(lines);
        var view = new View(model, global);

        global.addHosts(model.hosts);
        global.addView(view);

        return view;
    });

    global.setColors();

    views.forEach(function(v) {
        v.draw();
    });

    $("#graph").show();


    /*
    The following snippet of code is an attempt to address issue #14: Grey out process boxes 
    once their events have been scrolled through. The code checks to see if the final node in 
    the process is in view. If it is, then it greys out the process box, else it does not. 
    It is commented out because the code generates the following bugs:
      1. Once the boxes are greyed out, scrolling up would cause all the boxes to be coloured in at once.
      2. The boxes do not get greyed out once they are immediately scrolled out of view. You have to scroll down one more time to see it greyed out
      You can see the above two bugs here: http://olzhang.bitbucket.org/shiviz.html. 
      Source code here: https://bitbucket.org/olzhang/olzhang.bitbucket.org
      
      The .bind("inview",  function(event, isInView, visiblePartX, visiblePartY) {…} is not a 
      native jquery method. It is made possible by the jquery.inview 
      library (https://github.com/protonet/jquery.inview) (not included here). 
      The following snippet of code uses this inview method, which returns a boolean value to detect 
      whether an element of the DOM is visible to the user. Returns false if the object is not viewable; 
      true if it is.    

      For easy debugging, you can type in hostColors into the console to see the colours 
      associated with each process box, or lastNodesElement to see the final node 
      associated with the process, and hosts to see the hostId ossociated with each process.
      */   


    
    /*
    createLastNodeElements();
    
    for(n in lastNodesElements) {
      // binds the inview event to each final node 
      $(lastNodesElements[n]).bind("inview",  function(event, isInView, visiblePartX, visiblePartY) {
          
          
          var matchingHostId = $(this).find('circle').attr('id');
          // matches each last node with the corresponding host 
          var matchingHost = $("rect").filter(function() {
              if($(this).attr("id")==matchingHostId) {
                  return $(this);
              }
          });
          var lastScrollTop = 0;
          $(window).scroll(function(event){
              var st = $(this).scrollTop();
              if (st > lastScrollTop) {
                  // downscroll code
                  if(!isInView) {
                      // if you are scrolling down and the final node is out of view 
                      // grey out the host (i.e. process box) 
                      $(matchingHost).attr("style", "stroke: #ffffff; fill: #cdcdcd;");
                  } else {
                      // if you are scrolling down and the final node is not out of view, they keep
                      // the original colour of the process box  
                      var k;
                      for(var c in hostColors) {
                          if(c==matchingHostId)
                              k = hostColors[c]; 
                      }
                      $(matchingHost).attr("style", "stroke: #ffffff; fill: "+k+";");
                  }
              } else {
                  if(!isInView || ($(matchingHost).css("fill")=="#cdcdcd")) {
                      // if you are scrolling up and the final node is not inview and the 
                      // host (i.e. the process box) is greyed out then keep it greyed out  
                      $(matchingHost).attr("style", "stroke: #ffffff; fill: #cdcdcd;");
                  } else {
                      // if you are scrolling up and the final node is not out of view, then keep
                      // the original colour of the process box 
                      var k;
                      for(var c in hostColors) {
                          if(c==matchingHostId)
                              k = hostColors[c]; 
                      }
                      $(matchingHost).attr("style", "stroke: #ffffff; fill: "+k+";");
                  }
              }
              lastScrollTop = st;
          });
      });
    }
    */
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

function handleLogFileResponse(response, linkObj) {
    $("#logField").val(response);
    resetView();
    $(linkObj).css({
        color: "gray",
        pointerEvents: "none"
    });
}

function loadExample(filename, linkObj) {
    // logUrlPrefix is defined in dev.js && deployed.js
    var url = logUrlPrefix + filename;
    $.get(url, function(response) {
        handleLogFileResponse(response, linkObj);
    }).fail(function() {
        var errText = 'Unable to retrieve example log: ' + url;
        console.log(errText);
        alert(errText);
    });
}

$(window).on("scroll", function() {
    var top = window.pageYOffset ? window.pageYOffset
            : document.documentElement.scrollTop ? document.documentElement.scrollTop
                    : document.body.scrollTop;
    var left = ($(window).width() - $("body").width()) / 2
            - $(document).scrollLeft() + "px";
    if ($('#topBar').height()
            && top > $('#topBar').css('position', 'relative').offset().top
                    - parseInt($('#topBar p').css('margin-top'))) {
        $("#topBar").css({
            position: "fixed",
            top: "0"
        });

        // Time flow div.
        $("#sideBar").css({
            position: "fixed",
            top: $("#topBar").height() + "px",
            left: left
        });

        // Hidden hosts div
        $("#hosts").css({
            position: "fixed",
            top: $("#topBar").height() + $("#hostBar").height() + "px",
            marginLeft: "800px"
        });

        $("#hostBar").css({
            position: "fixed",
            top: "50px",
            left: left,
            marginLeft: "40px"
        });

        $("#vizContainer").css({
            marginTop: $("#topBar").height()
                       - parseInt($("#topBar p").css("margin-top")) + 55 + "px",
            marginLeft: "40px"
        });

    }
    else {
        $("#topBar").css("position", "relative");

        $("#sideBar").css({
            position: "relative",
            top: "",
            left: ""
        });

        $("#hosts").css({
            position: "relative",
            marginLeft: 0,
            top: 0
        });

        $("#hostBar").css({
            position: "relative",
            marginLeft: 0,
            left: "",
            top: 0
        });

        $("#vizContainer").css({
            marginLeft: "0",
            marginTop: ""
        })
    }
});

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
