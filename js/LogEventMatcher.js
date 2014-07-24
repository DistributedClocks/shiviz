
function LogEventMatcher(query) {
    
    if(!LogEventMatcher.hasStaticInit) {
        LogEventMatcher.staticInit();
    }
    
    function tokenize(query) {
        var tokens = [];
        
        query = query.replace(/\s+/g, " ");
        
        var currToken = "";
        
        for(var i = 0; i < query.length; i++) {
            var char = query.charAt(i);
            
            if(char == " " || !!LogEventMatcher.tokenSet[char]) {
                if(currToken != "") {
                    tokens.push(currToken);
                }
                currToken = "";
                if(!!LogEventMatcher.tokenSet[currToken]) {
                    tokens.push(char);
                }
            }
            else {
                currToken += char;
            }
        }
        
        return tokens;
    }
    
    function toRPN(tokens) {
        
        var rpn = [];
        var stack = [];
        
        for(var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            
            if(!!LogEventMatcher.functionSet[token] || token == "(") {
                stack.push(token);
            }
            else if(token == ",") {
                while(stack.length > 0 && stack[stack.length - 1] != "(") {
                    rpn.push(stack.pop());
                }
                
                if(stack.length == 0) {
                    throw new Exception();
                }
            }
            else if(!!LogEventMatcher.operatorSet[token]) {



            }
            else if(token == ")") {
                while(stack.length > 0 && stack[stack.length - 1] != "(") {
                    rpn.push(stack.pop());
                }
                
                if(stack.length == 0) {
                    throw new Exception();
                }
                
                stack.pop();
                
                if(stack.length > 0 && !!LogEventMatcher.functionSet[stack[stack.length - 1]]) {
                    rpn.push(stack.pop());
                }

            }
            else {
                rpn.push(token);
            }
        }
        
        while(stack.length != 0) {
            var curr = stack.pop();
            
            if(curr == ")" || curr == "(") {
                throw new Exception();
            }
            
            rpn.push(curr);
        }
        
        return rpn;
    }

}

LogEventMatcher.tokens = ["(", ")", "+", "-", "|", "&", "*", "/", "^", ","];
LogEventMatcher.tokenSet = {};

LogEventMatcher.operatorSet = {
        "|": new LEMOp(1, false, function(arr) {
            return arr[0] || arr[1];
        }),
        "&": new LEMOp(2, false, function(arr) {
            
        }),
        "+": new LEMOp(3, false, function(arr) {
            
        }),
        "-": new LEMOp(3, false, function(arr) {
            
        }),
        "/": new LEMOp(4, false, function(arr) {
            
        }),
        "*": new LEMOp(4, false, function(arr) {
            
        }),
        "^": new LEMOp(5, true, function(arr) {
            
        }),
};

LogEventMatcher.functions = {
        
};

LogEventMatcher.hasStaticInit = false;

LogEventMatcher.staticInit = function() {
    
    LogEventMatcher.hasStaticInit = true;
    
    for(var i = 0; i < LogEventMatcher.tokens; i++) {
        LogEventMatcher.tokenSet[LogEventMatcher.tokens[i]] = true;
    }
    
};

LogEventMatcher.prototype.match = function(logEvent) {
    
};

function LEMOp(precedence, rightAssoc, func) {
    
    this.precedence = precedence;
    
    this.rightAssoc = rightAssoc;
    
    this.func = func;
}

