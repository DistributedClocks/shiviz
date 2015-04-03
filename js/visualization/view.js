/**
 * Constructs a View that draws the specified model
 * 
 * @class
 * 
 * A View is responsible for drawing a single VisualGraph.
 * 
 * @constructor
 * @param {ModelGraph} model
 * @param {HostPermutation} hostPermutation
 * @param {String} label
 */
function View(model, hostPermutation, label) {
    
    /** @private */
    this.$svg = $(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    
    /** @private */
    this.$hostSVG = $(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    
    /** @private */
    this.logTable = $("<td></td>");
    
    /** @private */
    this.hostPermutation = hostPermutation;

    /** @private */
    this.label = label;

    /** @private */
    this.initialModel = model;

    /** @private */
    this.layout = new SpaceTimeLayout(0, 56);

    /** @private */
    this.visualGraph = new VisualGraph(model, this.layout, hostPermutation);

    /** @private */
    this.transformer = new Transformer();
    
    /** @private */
    this.controller = null;
    
}

/**
 * Gets the transformer associated with this view. In other words, the
 * transformer configured for and responsible for transforming the
 * {@link VisualGraph} that this view draws.
 * 
 * @returns {Transformer} The transformer associated with this view
 */
View.prototype.getTransformer = function() {
    return this.transformer;
};

View.prototype.getSVG = function() {
    return this.$svg;
};

View.prototype.getHostSVG = function() {
    return this.$hostSVG;
};

View.prototype.getLogTable = function() {
    return this.logTable;
};

/**
 * Gets the hosts as an array
 * 
 * @returns {Array<String>} The hosts
 */
View.prototype.getHosts = function() {
    return this.initialModel.getHosts();
};

/**
 * Gets the model
 * 
 * @returns {Graph} The model
 */
View.prototype.getModel = function() {
    return this.model;
};

/**
 * Gets the label
 * 
 * @returns {Graph} The label
 */
View.prototype.getLabel = function() {
    return this.label;
};

/**
 * Gets the current visual model
 * 
 * @returns {VisualGraph} The current model
 */
View.prototype.getVisualModel = function() {
    return this.visualGraph;
};

/**
 * Sets the width of this view
 * 
 * @param {Number} newWidth The new width
 */
View.prototype.setWidth = function(newWidth) {
    this.layout.setWidth(newWidth);
};

View.prototype.setLogTableWidth = function(newWidth) {
    this.logTable.width(newWidth + "pt");
};

/**
 * Returns whether this modelGraph has the given host
 * 
 * @returns {Boolean} True if the graph has this particular host
 */
View.prototype.hasHost = function(host) {
    return this.initialModel.hasHost(host);
};

/**
 * Clears the current visualization and re-draws the current model.
 */
View.prototype.draw = function() {

    this.model = this.initialModel.clone();	
    this.visualGraph = new VisualGraph(this.model, this.layout, this.hostPermutation);
    this.transformer.transform(this.visualGraph);
	
    // Update the VisualGraph
    this.visualGraph.update();

    // Define locally so that we can use in lambdas below
    var view = this;

    this.$svg.children("*").remove();

    this.$svg.attr({
        "height": this.visualGraph.getHeight(),
        "width": this.visualGraph.getWidth()
    });
    
    var hackyFixRect = Util.svgElement("rect");
    hackyFixRect.attr({
        "height": this.visualGraph.getHeight() + "px",
        "width": this.visualGraph.getWidth() + "px",
        "opacity": 0,
        "stroke-width": "0px",
        "z-index": -121
    });
    this.$svg.append(hackyFixRect);

    drawLinks();
    drawNodes();
    drawHosts();
    drawLogLines();

    // Hide line highlight
    $(".highlight").hide();

    function drawLinks() {
        view.visualGraph.getVisualEdges().forEach(function(visualEdge) {
            view.$svg.append(visualEdge.getSVG());
        });
    }

    function drawNodes() {
        var nodes = view.visualGraph.getNonStartVisualNodes();
        var arr = [];
        nodes.forEach(function(visualNode) {
            var svg = visualNode.getSVG();
            view.$svg.append(svg);
            arr.push(svg[0]);
        });

        // Bind the nodes
        view.controller.bindNodes(d3.selectAll(arr).data(nodes));
    }

    function drawHosts() {
        
        view.$hostSVG.children("*").remove();
        
        view.$hostSVG.attr({
            "width": view.visualGraph.getWidth(),
            "height": Global.HOST_SIZE,
            "class": view.id
        });
        
        var startNodes = view.visualGraph.getStartVisualNodes();
        var arr = [];
        startNodes.forEach(function(visualNode) {
            var svg = visualNode.getSVG();
            view.$hostSVG.append(svg);
            arr.push(svg[0]);
        });
        
        // Bind the hosts
        view.controller.bindHosts(d3.selectAll(arr).data(startNodes));
    }

    function drawLogLines() {
        view.logTable.empty();
        
        var lines = {};
        var visualNodes = view.getVisualModel().getVisualNodes();
        for (var i in visualNodes) {
            var node = visualNodes[i];
            var y = node.getY();
            if (lines[y] === undefined)
                lines[y] = [ node ];
            else
                lines[y].push(node);
        }

        delete lines[0];
        var first = true;

        for (var y in lines) {
            var overflow = null;
            var vn = lines[y];
            var startMargin = (1 - Math.min(vn.length, 3)) / 2;

            if (vn.length > 3)
                overflow = vn.splice(2, vn.length);

            if (first) {
                var $div = $("<div></div>", {
                }).addClass("logLabel").css({
                      "top": y + "px"
                }).text(view.getLabel());
                view.logTable.append($div);
                startMargin = startMargin + 2;
                first = false;
            }
			
            for (var i in vn) {
                var text = vn[i].getText();
                var $div = $("<div></div>", {
                    "id": "line" + vn[i].getId()
                }).data({
                    "id": vn[i].getId()
                }).addClass("line").css({
                    "top": y + "px",
                    "margin-top": startMargin + "em",
                    "color": vn[i].getFillColor(),
                    "opacity": vn[i].getOpacity()
                }).text(text);
                view.logTable.append($div);
                startMargin++;
            }

            if (overflow != null) {
                var $div = $("<div></div>").addClass("line more").css({
                    "top": y + "px",
                    "margin-top": (startMargin * 10) + "pt",
                    "color": "#ddd"
                }).text("+ " + overflow.length + " more");

                for (var o in overflow) {
                    var text = overflow[o].getText();
                    $div.append($("<div></div>", {
                        "id": "line" + overflow[o].getId()
                    }).data({
                        "id": overflow[o].getId()
                    }).addClass("line").css({
                        "margin-top": o + "em",
                        "color": overflow[o].getFillColor(),
                        "opacity": vn[i].getOpacity()
                    }).text(text));
                    startMargin++;
                }

                view.logTable.append($div);
            }
        }

    }
};
