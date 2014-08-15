function GraphBuilderHost(graphBuilder, hostNum) {
    
    this.hostNum = hostNum;


    this.graphBuilder = graphBuilder;

    var host = this;

    this.rx = hostNum * 65;
    this.x = this.rx + 12.5;
    this.color = graphBuilder.colors.pop();
    this.nodes = [];

    this.rect = SVGElement("rect").attr({
        "width": 25,
        "height": 25,
        "fill": this.color,
        "x": this.rx,
        "y": 0
    }).on("dblclick", function() {
        graphBuilder.removeHost(host);
    }).prependTo(graphBuilder.getSVG());

    this.line = SVGElement("line").attr({
        "x1": this.x,
        "y1": 30,
        "x2": this.x,
        "y2": 500
    }).prependTo(graphBuilder.getSVG());
}

GraphBuilderHost.hasStaticInit = false;

GraphBuilderHost.prototype.getName = function() {
    return String.fromCharCode(97 + this.hostNum);
};

GraphBuilderHost.prototype.getNodes = function() {
    return this.nodes.slice();
};

GraphBuilderHost.prototype.getNodesSorted = function() {
    return this.getNodes().sort(function(a, b) {
        return a.y - b.y;
    });
};

GraphBuilderHost.prototype.addNode = function(y, tmp) {

    var node = new GraphBuilderNode(this.graphBuilder, this.x, y, tmp, this.color);

    this.nodes.push(node);
    this.graphBuilder.convert();
    this.graphBuilder.bind();

    return node;
};

GraphBuilderHost.prototype.removeNode = function(node) {
    node.getLines().forEach(function(l) {
        l.remove();
    });
    Array.remove(this.nodes, node);
    node.getCircle().remove();
    this.graphBuilder.convert();
};

GraphBuilderHost.prototype.removeAllNodes = function() {
    while (this.nodes.length > 0)
        this.removeNode(this.nodes[0]);
    this.nodes = [];
};

GraphBuilderHost.prototype.getColor = function() {
    return this.color;
};
