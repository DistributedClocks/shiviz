spaceTimeLayout = function() {
    var spaceTime = {}, nodes = [], links = [], width = 760, height = 0, hosts = [];

    spaceTime.nodes = function(x) {
        if (!arguments.length)
            return nodes;
        nodes = x;
        return spaceTime;
    };

    spaceTime.links = function(x) {
        if (!arguments.length)
            return links;
        links = x;
        return spaceTime;
    };

    spaceTime.width = function(x) {
        if (!arguments.length)
            return width;
        width = x;
        return spaceTime;
    };

    spaceTime.height = function(x) {
        if (!arguments.length)
            return height;
        height = x;
        return spaceTime;
    };

    spaceTime.hosts = function(x) {
        if (!arguments.length)
            return hosts;
        hosts = x;
        return spaceTime;
    };

    spaceTime.start = function() {

        // This is the amount of vertical spacing between nodes
        var delta = 45;

        var n = nodes.length, m = links.length, o;

        // Assign each node an index
        for (var i = 0; i < n; ++i) {
            o = nodes[i];
            o.index = i;
            o.y = delta;
            o.children = [];
            o.parents = 0;
        }

        // All vertical positions are initialized to delta
        height = delta;

        // Give each link the source/target node objects based on indices
        // computed
        // above
        for (var i = 0; i < m; ++i) {
            o = links[i];
            if (typeof o.source == "number")
                o.source = nodes[o.source];
            if (typeof o.target == "number")
                o.target = nodes[o.target];
            o.source.children.push(o.target);
            o.target.parents++;
        }

        // Going to want to sort the nodes by increasing number of parents and
        // put
        // them in a priority queue
        var remainingNodes = [];

        for (var i = 0; i < n; ++i) {
            remainingNodes.push(nodes[i]);
        }

        while (remainingNodes.length > 0) {
            remainingNodes.sort(function(a, b) {
                return b.parents - a.parents;
            });

            o = remainingNodes.pop();

            horizontalPos = width / hosts.length * hosts.indexOf(o.group)
                    + (width / hosts.length / 2);
            o.x = horizontalPos;
            for (var i = 0; i < o.children.length; ++i) {
                o.children[i].parents--;
                // Increment child position by delta
                if (o.y + delta > o.children[i].y) {
                    o.children[i].y = o.y + delta;
                    height = Math.max(height, o.y + delta);
                }
            }
        }

        height += delta;

        return spaceTime;
    };

    return spaceTime;
};
