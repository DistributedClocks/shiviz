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
    
    /**
     * Cacheed mapping of hostnames to abbreviated hostnames
     * @private
     */
    this.abbreviatedHostnames = null; // {String} -> {String}

    /** 
    * Used to determine if a tailnode is scrolling out of view
    * @private
    */
    this.tailNodes = [];

    /**
    * A mapping of hostnode names to their visual nodes
    * @private
    */
    this.hostNodes = new Map();
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
    return this.initialModel;
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
 * Returns whether this modelGraph has structures matching the current query
 *
 * @returns {Boolean} True if this modelGraph has elements matching the current search
 */
View.prototype.hasQueryMatch = function() {
    var hmt = this.getTransformer().getHighlightMotifTransformation();
    if (hmt != null) { 
        hmt.findMotifs(this.initialModel);
        return hmt.getHighlighted().getMotifs().length > 0;
    } else {
        return false;
    }
}

/**
 * Clears the current visualization and re-draws the current model.
 */
View.prototype.draw = function(viewPosition) {

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
            if (visualNode.isLast()) {
                view.tailNodes.push(visualNode);
            }
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

        if (viewPosition == "R") {
            view.$hostSVG.css("margin-left", ".15em");
        }
        
        else {
            view.$hostSVG.css("margin-left", "0em");
        }
        var startNodes = view.visualGraph.getStartVisualNodes();
        var arr = [];
        startNodes.forEach(function(visualNode) {
            view.hostNodes.set(visualNode.getHost(), visualNode);
            var svg = visualNode.getSVG();
            view.$hostSVG.append(svg);
            arr.push(svg[0]);
        });

        // Bind the hosts
        view.controller.bindHosts(d3.selectAll(arr).data(startNodes));

        drawHostLabels(arr);
    }

    function drawHostLabels(g_hosts) {
        view.$hostSVG.attr("overflow", "visible");

        var hosts = d3.selectAll(g_hosts);
        var x_offset = Global.HOST_SIZE / 3;
        var hostLabels = hosts.append("text")
            .text(function(node) {
                const label = view.getAbbreviatedHostname(node.getHost());
                return label;
            })
            //.attr("text-anchor", "middle")
            .attr("transform", "rotate(-45)")
            .attr("x", x_offset)
            .attr("y", "1em")
            .attr("font-size", "x-small");

        if (!view.hasAbbreviatedHostnames()) {
            setTimeout(function() {
                // Must abbreviate after timeout so that the text elements will have
                // been drawn. Otherwise they will have no computed text length.
                abbreviateD3Texts(hostLabels);
            });
        }
    }

    function abbreviateD3Texts(d3Texts) {
        const textsToFitter = getD3FitterMap(d3Texts, Global.HOST_LABEL_WIDTH);
        const textsToSetter = getD3SetterMap(d3Texts);

        // Must come after after creating the textsToXXXMaps, since it mutates
        // the d3Texts
        const abbrevs = Abbreviation.generateFromStrings(textsToFitter);

        for (let abbrev of abbrevs) {
            const hostname = abbrev.getOriginalString();
            view.setAbbreviatedHostname(hostname, abbrev.getEllipsesString());

            let setText = textsToSetter.get(hostname);
            setText(abbrev);
        }

        function getD3FitterMap(d3Texts, svgWidth) {
            const textsToFitter = new Map();
            d3Texts.each(function() {
                const d3Text = d3.select(this);
                const self = this;
                textsToFitter.set(d3Text.text(),
                    function (str) {
                        d3Text.text(str);
                        return self.getComputedTextLength() < svgWidth;
                    });
            });
            return textsToFitter;
        }
        
        function getD3SetterMap(d3Texts) {
            const textsToSetter = new Map();
            d3Texts.each(function() {
                const d3Text = d3.select(this);
                const setAbbrevText = makeAbbrevTextSetter(this);
                textsToSetter.set(d3Text.text(), setAbbrevText);
                    
            });
            return textsToSetter;
        }

        function makeAbbrevTextSetter(svgText) {
            const d3Text = d3.select(svgText);
            return function(abbrev) {
                d3Text.text(abbrev.getEllipsesString());
            };
        }
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
            // nodes with the same y coordinate saved in lines[y]
            else
                lines[y].push(node);
        }

        delete lines[0];

        var $div = $("<div></div>");
        $div.addClass("logLabel" + viewPosition);
        $div.text(view.getLabel());
        view.logTable.append($div);

        for (var y in lines) {
            var overflow = null;
            var vn = lines[y];
            // shift the log lines down by adding 20px or about 1.5em to the y coordinate
            var top = (Number(y) + 20).toString();
            var startMargin = (1 - Math.min(vn.length, 3)) / 2;

            if (vn.length > 3)
                overflow = vn.splice(2, vn.length);

            for (var i in vn) {
                var text = vn[i].getText();
                var $div = $("<div></div>", {
                    "id": "line" + vn[i].getId()
                }).data({
                    "id": vn[i].getId()
                }).addClass("line").css({
                    "top": top + "px",
                    "margin-top": startMargin + "em",
                    "color": vn[i].getFillColor(),
                    "opacity": vn[i].getOpacity()
                }).text(text);
                view.logTable.append($div);
                startMargin++;
            }

            if (overflow != null) {
                var $div = $("<div></div>").addClass("line more").css({
                    "top": top + "px",
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
}
/**
 * Returns true if the abbrviated hostname strings have been cached.
 * @return {boolean} 
 */
View.prototype.hasAbbreviatedHostnames = function() {
    return this.abbreviatedHostnames !== null;
};

/**
 * Gets the abbreiviated hostname string associated with given hostname
 * string. If no abbreviation is recorded, then returns original string.
 * @param {string} hostname
 * @return {string} abbreviated hostname
 */
View.prototype.getAbbreviatedHostname = function(hostname) {
    if (this.hasAbbreviatedHostnames() &&
        this.abbreviatedHostnames.has(hostname)) {
        return this.abbreviatedHostnames.get(hostname);
    } else {
        return hostname;
    }
};

/**
 * Caches the abbreviated hostname, creating the cache if necessary
 * @param {string} hostname Complete hostname
 * @param {string} abbrev Abbreviated, ellipsified hostname
 */
View.prototype.setAbbreviatedHostname = function(hostname, abbrev) {
    if (!this.hasAbbreviatedHostnames()) {
        this.abbreviatedHostnames = new Map();
    }
    this.abbreviatedHostnames.set(hostname, abbrev);
}

/**
 * If isScrolledPast is true, changes colour of visualNode's host to grey.
 * If it is false, changes host node back to the original colour
 * @param {VisualNode} 
 * @param {Boolean}
 */
View.prototype.setGreyHost = function(visualNode, isScrolledPast) {
    const view = this;
    const visualHostNode = this.hostNodes.get(visualNode.getHost());
    if (isScrolledPast) {
        // set to grey
        visualHostNode.setFillColor("white");
        visualHostNode.setStrokeColor("lightgrey");
        visualHostNode.setHostLabelColor("grey");
        visualHostNode.setStrokeWidth(1);
    } else {
        // reset to original colour
        const fillColor = this.hostPermutation.getHostColor(visualNode.getHost());
        visualHostNode.setFillColor(fillColor);
        visualHostNode.setHostLabelColor("black");
        visualHostNode.setStrokeColor(Global.NODE_STROKE_COLOR);
        visualHostNode.setStrokeWidth(Global.NODE_STROKE_WIDTH);
    }
}

/**
 * Return the tail nodes of each host in this view's graph
 * @return {VisualNode[]}
 */
View.prototype.getTailNodes = function() {
    return this.tailNodes;
};

