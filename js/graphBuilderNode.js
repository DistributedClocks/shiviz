

function GraphBuilderNode(graphBuilder, x, y, tmp, color) {
    
    this.id = GraphBuilderNode.id++;
    
    this.graphBuilder = graphBuilder;
    
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.state = tmp ? "tmp" : false;
    this.parents = [];
    this.children = [];
    this.lines = [];
    
    this.color = color;

    var context = this;
    this.circle = $(SVGElement("circle")).attr({
        "r": 5,
        "cx": x,
        "cy": y,
        "fill": context.color
    }).appendTo(graphBuilder.getSVG());

    this.circle[0].node = this;

}

GraphBuilderNode.id = 0;

GraphBuilderNode.prototype.getId = function() {
    return this.id;
};

GraphBuilderNode.prototype.getLines = function() {
    return this.lines.slice();
};

GraphBuilderNode.prototype.getCircle = function() {
    return this.circle;
};


GraphBuilderNode.prototype.addChild = function (n, l) {
    var line = new Line(this, n, l);
    this.children.push(n);
    this.lines.push(line);
    n.parents.push(this);
    n.lines.push(line);
    this.graphBuilder.convert();
};

GraphBuilderNode.prototype.removeChild = function (n) {
    Array.remove(this.children, n);
    Array.remove(n.parents, this);
};

GraphBuilderNode.prototype.getChildren = function() {
    return this.children.slice();
};


function Line(parent, child, line) {
    this.parent = parent;
    this.child = child;
    this.line = line;
}

Line.prototype.remove = function () {
    this.parent.removeChild(this.child);
    Array.remove(this.parent.lines, this);
    Array.remove(this.child.lines, this);
    this.line.remove();
};