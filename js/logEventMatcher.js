
function LogEventMatcher(query) {
    
    this.query = query;
    
    try {
        
        this.tokenizer = new LEMTokenizer(query);
        
        var parser = new LEMParser(this.tokenizer);
        
        this.ast = parser.parse();
        
        this.interpreter = new LEMInterpreter(this.ast);
    }
    catch(e) {
        if(e.constructor == Exception) {
            e.setUserFriendly(true);
            e.append("\n");
            var querytext = query + "\n";
            
            var count = this.tokenizer.getNumCharsConsumed() - 1;
            while(count-- > 0) {
                querytext += " ";
            }
            querytext += "^";
            e.append(querytext, "code");
        }
        throw e;
    }
    
}

LogEventMatcher.prototype.match = function(logEvent) {
    try{
        return this.interpreter.interpret(logEvent);
    }
    catch(e) {
        if(e.constructor == Exception) {
            e.setUserFriendly(true);
            e.append("\n");
            e.append(this.query, "code");
        }
        throw e;
    }
};

LogEventMatcher.prototype.matchAny = function(logEvents) {
    for(var i = 0; i < logEvents.length; i++) {
        if(this.match(logEvents[i])) {
            return true;
        }
    }
    return false;
};



