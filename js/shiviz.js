var get = function(id) {
    return document.getElementById(id);
};

// an alternative to the above commented out code. This resolves issue 18
// and prevents the innocuos keys such as 'ctrl' from resetting the view
$("#logField").on('input propertychange', function(e) {
    resetView();
});

get("versionContainer").innerHTML = versionText;

// variables to store last node in a process
var lastNodesElements = {};
// variable to store original colours
var hostColors = {};
// variables to store the id attached to each process box
var hosts = {};

function resetView() {
    // Enable/disable the visualize button depending on whether or not
    // the text area is empty.
    if (get("logField").value == '') {
        get("vizButton").disabled = true;
    }
    else {
        get("vizButton").disabled = false;
    }

    get("curNode").innerHTML = "(click to view)";
    get("graph").hidden = true;

    d3.selectAll("svg").remove();

    // Reset the color of all of the log-links.
    var links = document.getElementsByClassName("log-link");
    for (var i = 0; i < links.length; i++) {
        links[i].style.color = "";
    }
};

get("vizButton").onclick = function() {
    d3.selectAll("svg").remove();

    var textBox = get("logField");
    var executions = textBox.value.split(/^======$/m);

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

    get("graph").hidden = false;


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

function handleLogFileResponse(response, linkObj) {
    get("logField").value = response;
    resetView();
    linkObj.style.color = "grey";
    // TODO 1: set linkObj's href to none to eliminate unnecessary
    // network traffic. But, need to have a way to reset this back.

    // TODO 2: remove linkObj's hover effect.
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

window.onscroll = function() {
    var top = window.pageYOffset ? window.pageYOffset
            : document.documentElement.scrollTop ? document.documentElement.scrollTop
                    : document.body.scrollTop;
    var left = ($(window).width() - $("body").width()) / 2
            - $(document).scrollLeft() + "px";
    if ($('#topBar').height()
            && top > $('#topBar').css('position', 'relative').offset().top
                    - parseInt($('#topBar p').css('margin-top'))) {
        get("topBar").style.position = "fixed";
        get("topBar").style.top = "0px";

        // Time flow div.
        get("sideBar").style.position = "fixed";
        get("sideBar").style.top = $("#topBar").height() + "px";
        get("sideBar").style.left = left;

        // Hidden hosts div
        get("hosts").style.position = "fixed";
        get("hosts").style.top = $("#topBar").height() + $("#hostBar").height()
                + "px";
        get("hosts").style.marginLeft = "800px";

        get("hostBar").style.position = "fixed";
        get("hostBar").style.top = "50px";
        get("hostBar").style.left = left;
        get("hostBar").style.marginLeft = "40px";

        get("vizContainer").style.marginLeft = "40px";
        get("vizContainer").style.marginTop = $("#topBar").height()
                - parseInt($("#topBar p").css("margin-top")) + 55 + "px";

    }
    else {
        get("topBar").style.position = "relative";

        get("sideBar").style.position = "relative";
        get("sideBar").style.top = "";
        get("sideBar").style.left = "";

        get("hosts").style.position = "relative";
        get("hosts").style.marginLeft = "0px";
        get("hosts").style.top = "0px";

        get("hostBar").style.position = "relative";
        get("hostBar").style.marginLeft = "0px";
        get("hostBar").style.left = "";
        get("hostBar").style.top = "0px";

        get("vizContainer").style.marginLeft = "0px";
        get("vizContainer").style.marginTop = "";
    }
};

function selectTextareaLine(tarea, lineNum) {
    var lineLength = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".length;

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
