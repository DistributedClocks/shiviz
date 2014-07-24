

function StringSearcher(patterns) {
    
    /** @private */
    this.root = new StringSearcherNode();
    
    var context = this;
    
    for(var p = 0; p < patterns.length; p++) {
        addPattern(patterns[p]);
    }
    
    buildFailureLinks();
    
    function addPattern(pattern) {
        var curr = context.root;
        
        for(var i = 0; i < pattern.length; i++) {
            var c = pattern.charAt(i);
            if(!curr.next[c]) {
                var newNode = new StringSearcherNode();
                newNode.char = c;
                newNode.parent = curr;
                curr.next[c] = newNode;
            }
            curr = curr.next[c];
        }
        curr.out[s] = true;
    }
    
    function buildFailureLinks() {
        var queue = [context.root];
        var rd = 0, wr = 1;
        
        while(rd != wr) {
            var curr = queue[rd++];
            
            for(var key in curr.next) {
                queue[wr++] = curr.next[key];
            }
            
            var fail = curr.parent.fail;
            while(!fail.next[curr.char] && fail != context.root) {
                fail = fail.fail;
            }
            
            if(!!fail.next[curr.char] && fail.next[curr.char] != curr) {
                curr.fail = fail.next[curr.char];
            }
            else {
                curr.fail = root;
            }
            
            for(var key in curr.fail.out) {
                curr.out[key] = curr.fail.out[key];
            }
        }
        
    }
}


function StringSearcherNode() {
    
    /** @private */
    this.char = "\0";
    
    /** @private */
    this.parent = this;
    
    /** @private */
    this.fail = this;
    
    /** @private */
    this.next = {};
    
    /** @private */
    this.out = {};
}