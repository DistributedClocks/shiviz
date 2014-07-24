
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
                
                


//                while there is an operator token, o2, at the top of the stack, and
//
//                        either o1 is left-associative and its precedence is less than or equal to that of o2,
//                        or o1 has precedence less than that of o2,
//
//                    pop o2 off the stack, onto the output queue;
//
//                push o1 onto the stack.


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
        "|": 1,
        "&": 2,
        "+": 3,
        "-": 3,
        "/": 4,
        "*": 4,
        "^": -5
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

