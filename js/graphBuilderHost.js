function GraphBuilderHost(graphBuilder, hostNum) {

    if (!GraphBuilderHost.hasStaticInit) {
        GraphBuilderHost.hasStaticInit = true;

        for ( var i = GraphBuilder.MAX_HOSTS + 1; i > 0; i--)
            GraphBuilderHost.colors.push(HSVtoRGB(i / GraphBuilder.MAX_HOSTS + .4, .4, .8));
    }

    this.graphBuilder = graphBuilder;

    var host = this;

    this.rx = hostNum * 65;
    this.x = this.rx + 12.5;
    this.color = GraphBuilderHost.colors[hostNum];
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

    function HSVtoRGB(h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (h && s === undefined && v === undefined) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        r = Math.floor(r * 255);
        g = Math.floor(g * 255);
        b = Math.floor(b * 255);
        return "rgb(" + r + "," + g + "," + b + ")";
    }
}

GraphBuilderHost.colors = [];

GraphBuilderHost.hasStaticInit = false;

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
    Array.remove(this.nodes, this);
    node.getCircle().remove();
    this.graphBuilder.convert();
};

GraphBuilderHost.prototype.removeAllNodes = function() {
    for ( var i = 0; i < this.nodes.length; i++) {
        this.removeNode(this.nodes[i]);
    }
    this.nodes = [];
};

GraphBuilderHost.prototype.getColor = function() {
    return this.color;
};
