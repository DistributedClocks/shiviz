var spaceGraph;
var collapsedNodes;
var hiddenHosts;
var hostColors;

var get = function (id) {
  return document.getElementById(id);
};

$("#logField").keydown(function() {
  resetView();
});

$("#logField").change(function() {
  resetView();
});

function resetView() {
  get("curNode").innerHTML = "(click to view)"
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

  // Initialize state 
  spaceGraph = new Graph();
  collapsedNodes = [];
  hiddenHosts = [];
  hostColors = {};

  if (!spaceGraph.parseLog(lines)) {
    // TODO: display error message
    return;
  }

  get("graph").hidden = false;

  var graphObj = spaceGraph.generateEdges().toLiteral();

  var color = d3.scale.category20();
  for (var i = 0; i < graphObj.hosts.length; i++) {
    var host = graphObj.hosts[i];
    hostColors[host] = color(host);
  }
  draw(graphObj);
};

function draw(graphObj) {
  graphObj = graphObj || spaceGraph.toLiteral(hiddenHosts);
  d3.selectAll("svg").remove();
  makeModel(graphObj);
  makeArrow();
  drawHiddenHosts();
}

function loadExample(filename, linkObj) {
  var file = 'http://www.corsproxy.com/bestchai.bitbucket.org/shiviz/' + filename;
  $.get(file, function(response) {
    get("logField").value = response;
    resetView();
    linkObj.style.color="grey";

    // TODO 1: set linkObj's href to none to eliminate unnecessary
    // network traffic. But, need to have a way to reset this back.

    // TODO 2: remove linkObj's hover effect.
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
}

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
