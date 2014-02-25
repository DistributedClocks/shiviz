var get = function (id) {
  return document.getElementById(id);
};

//an alternative to the above commented out code. This resolves issue 18
//and prevents the innocuos keys such as 'ctrl' from resetting the view 
$("#logField").on('input propertychange', function(e) {
  resetView();
});

get("versionContainer").innerHTML = versionText;

function resetView() {
  // Enable/disable the visualize button depending on whether or not
  // the text area is empty.
  if (get("logField").value == '') {
    get("vizButton").disabled = true;
  } else {
    get("vizButton").disabled = false;
  }

  get("curNode").innerHTML = "(click to view)";
  get("graph").hidden = true;

  d3.selectAll("svg").remove();

  // Reset the color of all of the log-links.
  var links = document.getElementsByClassName("log-link");
  for (var i = 0; i < links.length; i++) {
     links[i].style.color="";
  }
};

get("vizButton").onclick = function() {
  var textBox = get("logField");
  var lines = textBox.value.split('\n');

  var view = new View(generateGraphFromLog(lines));
  get("graph").hidden = false;
  view.draw();
};

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
  })
  .fail(function() {
    var errText = 'Unable to retrieve example log: ' + url;
    console.log(errText);
    alert(errText);
  });
}

window.onscroll=function () {
    var top = window.pageXOffset ? window.pageXOffset : document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;
    if(top > 630){
        get("topBar").style.position = "fixed";
        get("topBar").style.top="0px";

        // Time flow div.
        get("sideBar").style.position = "fixed";
        get("sideBar").style.top="85px";

        // Hidden hosts div
        get("hosts").style.position = "fixed";
        get("hosts").style.top="85px";
        get("hosts").style.marginLeft="800px";
        
        get("hostBar").style.position = "fixed";
        get("hostBar").style.top= "50px";
        get("hostBar").style.marginLeft="40px";

        get("vizContainer").style.marginLeft="40px";

    } else {
        get("topBar").style.position = "relative";

        get("sideBar").style.position = "relative";

        get("hosts").style.position = "relative";
        get("hosts").style.marginLeft="0px";
        get("hosts").style.top="0px";

        get("hostBar").style.position = "relative";
        get("hostBar").style.marginLeft="0px";
        get("hostBar").style.top= "0px";

        get("vizContainer").style.marginLeft = "0px";
    }
};

function selectTextareaLine(tarea,lineNum) {
    var lineLength = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".length;

    var lines = tarea.value.split("\n");

    var numLines = 0;
    // calculate start/end
    var startPos = 0, endPos = tarea.value.length;
    for(var x = 0; x < lines.length; x++) {
        if(x == lineNum) {
            break;
        }
        startPos += (lines[x].length+1);
        
        numLines += Math.ceil(lines[x].length / lineLength);
    }

    tarea.scrollTop = numLines * 13 - 20;
    var endPos = lines[lineNum].length+startPos;

    // do selection
    // Chrome / Firefox

    if(typeof(tarea.selectionStart) != "undefined") {
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
