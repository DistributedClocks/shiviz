
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

function LEMTokenizer(query) {
    
    if(!LEMTokenizer.hasStaticInit) {
        LEMTokenizer.hasStaticInit = true;
        
        for(var key in LEMTokenizer.tokens) {
            if(LEMTokenizer.tokens[key] != null) {
                LEMTokenizer.tokenSet[LEMTokenizer.tokens[key]] = key;
            }
        }
    }
    
    this.stack = query.split("").reverse();
    
    this.current = null;
    
    this.startCharCount = this.stack.length;
    
    this.hasScan = false;
    
}

LEMTokenizer.tokens = {
        "DOLLAR" : "$",
        "QUOTE" : "\"",
        "EXCLAMATION_EQUAL" : "!=",
        "EQUAL" : "=",
        "L_PAREN" : "(",
        "R_PAREN" : ")",
        "PIPE" : "|",
        "AMP" : "&",
        "CARET" : "^",
        "SLASH" : "/",
        "CHAR_SEQ" : null,
        "REGEX_LITERAL" : null,
        "STRING_LITERAL" : null
};

LEMTokenizer.tokenSet = {};

LEMTokenizer.hasStaticInit = false;

LEMTokenizer.prototype.getNumCharsConsumed = function() {
    return this.startCharCount - this.stack.length;
};

LEMTokenizer.prototype.hasNext = function() {
    if(!this.hasScan) {
        this.hasScan = true;
        this.scan();
    }
    
    return this.current != null;
};

LEMTokenizer.prototype.next = function() {
    if(!this.hasScan) {
        this.hasScan = true;
        this.scan();
    }
    
    var ret = this.current;
    this.scan();
    return ret;
};

LEMTokenizer.prototype.peek = function() {
    if(!this.hasScan) {
        this.hasScan = true;
        this.scan();
    }
    
    return this.current;
};

LEMTokenizer.prototype.scan = function() {
    
    this.hasScan = true;
    
    var context = this;
    
    while(hasNextChar() && isWhiteSpace(peek())) {
        this.stack.pop();
    }
    
    if(!hasNextChar()) {
        this.current = null;
        return;
    }
    
    if(isToken(peek()) || isToken(doublePeek())) {
        if(peek() == "/") {
            var tokenText = "";
            this.stack.pop();
            while(hasNextChar() && peek() != "/") {
                tokenText += this.stack.pop();
            }
            
            if(!hasNextChar()) {
                throw new Exception("Expected: /");
            }
            
            this.stack.pop();
            
            this.current = new Token("REGEX_LITERAL", tokenText);
        }
        else if(peek() == "\"") {
            var tokenText = "";
            this.stack.pop();
            while(hasNextChar() && peek() != "\"") {
                tokenText += this.stack.pop();
            }
            
            if(!hasNextChar()) {
                throw new Exception("Expected: \"");
            }
            
            this.stack.pop();
            
            this.current = new Token("STRING_LITERAL", tokenText);
        }
        else if(isToken(doublePeek())) {
            var type = LEMTokenizer.tokenSet[doublePeek()];
            this.current = new Token(type, doublePeek());
            this.stack.pop();
            this.stack.pop();
        }
        else if(isToken(peek())) {
            var type = LEMTokenizer.tokenSet[peek()];
            this.current = new Token(type, peek());
            this.stack.pop();
        }
    }
    else if (isAlphaNumeric(peek())) {
        var tokenText = "";
        while(hasNextChar() && isAlphaNumeric(peek())) {
            tokenText += this.stack.pop();
        }
        this.current = new Token("CHAR_SEQ", tokenText);
    }
    else {
        throw new Exception("Invalid character: " + this.stack.pop());
    }
    
        
    function isWhiteSpace(char) {
        return char == " " || char == "\n" || char == "\r" || char == "\t";
    }
    
    function isAlphaNumeric(char) {
        return /^[a-z0-9]$/i.test(char);
    }
    
    function isToken(char) {
        return !!LEMTokenizer.tokenSet[char];
    }
    
    function peek() {
        return context.stack[context.stack.length - 1];
    }
    
    function doublePeek() {
        var ret = peek();
        if(context.stack.length >=2) {
            ret += context.stack[context.stack.length - 2];
        }
        return ret;
    }
    
    function hasNextChar() {
        return context.stack.length != 0;
    }
      
};

function Token(type, text) {
    
    this.type = type;
    
    this.text = text;
}


function AST() {
    
}


function BinaryOp(op, lhs, rhs) {
    
    this.op = op;
    
    this.lhs = lhs;
    
    this.rhs = rhs;
}

BinaryOp.prototype.accept = function(visitor, pass) {
    return visitor.visitBinaryOp(this, pass);
};

function Identifier(name) {
    
    this.name = name;
}

Identifier.prototype.accept = function(visitor, pass) {
    return visitor.visitIdentifier(this, pass);
};

function StringLiteral(text) {
    
    this.text = text;
}

StringLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitStringLiteral(this, pass);
};

function RegexLiteral(text) {
    
    this.text = text;
}

RegexLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitRegexLiteral(this, pass);
};

function ImplicitSearch(text) {
    
    this.text = text;
}

ImplicitSearch.prototype.accept = function(visitor, pass) {
    return visitor.visitImplicitSearch(this, pass);
};



function LEMParser(tokenizer) {
    
    this.tokenizer = tokenizer;
    
    this.result = null;
    
}

LEMParser.prototype.parse = function() {
    
    var context = this;

    if(this.result != null) {
        return this.result;
    }
    
    return parseExpression();
    
    function parseExpression() {
        var ret = parseExpressionContents();
        if(checkAdvance("PIPE")) {
            return new BinaryOp("OR", ret, parseExpression());
        }
        else if(checkAdvance("CARET")) {
            return new BinaryOp("XOR", ret, parseExpression());
        }
        else if(checkAdvance("AMP")) {
            return new BinaryOp("AND", ret, parseExpression());
        }
        else if(check("L_PAREN", "CHAR_SEQ", "STRING_LITERAL")) {
            return new BinaryOp("AND", ret, parseExpression());
        }
        else {
            return ret;
        }
    }

    function parseExpressionContents() {
        require("L_PAREN", "CHAR_SEQ", "STRING_LITERAL");
        
        if(checkAdvance("L_PAREN")) {
            var ret = parseExpression();
            requireAdvance("R_PAREN");
            return ret;
        }
        else {
            if(check("STRING_LITERAL")) {
                return new ImplicitSearch(advance().text);
            }
            
            var charSeq = requireAdvance("CHAR_SEQ");
            
            if(checkAdvance("EQUAL")) {
                return new BinaryOp("EQUALS", new Identifier(charSeq.text), parseLiteralOrRef());
            }
            else if(checkAdvance("EXCLAMATION_EQUAL")) {
                return new BinaryOp("NOT_EQUALS", new Identifier(charSeq.text), parseLiteralOrRef());
            }
            else {
                return new ImplicitSearch(charSeq.text);
            }
        }
    }
    
    function parseLiteralOrRef() {
        if(checkAdvance("DOLLAR")) {
            return parseIdentifier();
        }
        else {
            return parseLiteral();
        }
    }
    
    function parseIdentifier() {
        return new Identifier(requireAdvance("CHAR_SEQ").text);
    }
    
    function parseLiteral() {
        if(check("REGEX_LITERAL")) {
            return new RegexLiteral(advance().text);
        }
        else {
            return parseStringLiteral();
        }
    }
    
    function parseStringLiteral() {
        require("CHAR_SEQ", "STRING_LITERAL");
        
        return new StringLiteral(advance().text);
    }
    
    
    
    
    function checkAdvance(type) {
        if(check(type)) {
            advance();
            return true;
        }
        else {
            return false;
        }
    }
    
    function requireAdvance(type) {
        require(type);
        return advance();
    }
    
    function advance() {
        return context.tokenizer.next();
    }
    
    function check() {
        if(!context.tokenizer.hasNext()) {
            return false;
        }
        
        var currType = peekType();
        for(var i = 0; i < arguments.length; i++) {
            if(currType == arguments[i]) {
                return true;
            }
        }
        return false;
    }
    
    function require() {
        if(context.tokenizer.hasNext()) {
            var currType = peekType();
            for(var i = 0; i < arguments.length; i++) {
                if(currType == arguments[i]) {
                    return;
                }
            }
        }
       
        var errString = "Expected: ";
        for(var i = 0; i < arguments.length; i++) {
            errString += arguments[i] + " or ";
        }
        throw new Exception(errString.replace(/or $/, ""));
    }
    
    function peekType() {
        return context.tokenizer.peek().type;
    }
    
//    expression = 
//        expressionContents, [[PIPE | AMP | CARET], expression]
//
//    expressionContents = 
//        L_PAREN, expression, R_PAREN
//        | implicitSearch
//        | identifier, (EQ | NE), literalOrRef
//
//    literalOrRef =
//        DOLLAR, identifier
//        | literal
//
//    literal =
//        stringLiteral | REGEX_LITERAL
//
//    identifier =
//        CHAR_SEQ
//
//    stringLiteral = 
//        CHAR_SEQ | STRING_LITERAL
//
//    implicitSearch = 
//        stringLiteral


};


function LEMInterpreter(ast) {
    
    this.ast = ast;
    
}

LEMInterpreter.prototype.interpret = function(logEvent) {
    var env = logEvent.getFields();
    env["event"] = logEvent.getText(); //TODO
    var ret = this.ast.accept(this, env);
    return ret.asBoolean();
};

LEMInterpreter.prototype.visitBinaryOp = function(ast, env) {
    var lhs = ast.lhs.accept(this, env);
    var rhs = ast.rhs.accept(this, env);
    
    if(ast.op == "EQUALS" || ast.op == "NOT_EQUALS") {
        var val = false;
        if(rhs.type == "REGEX") {
            var regex = new RegExp(rhs.val); //TODO
            val = regex.test(lhs.asString());
        }
        else if(rhs.type == "STRING") {
            val = lhs.asString() == rhs.asString();
        }
        else {
            throw new Exception("a"); //TODO
        }
        
        if(ast.op == "NOT_EQUALS") {
            val = !val;
        }
        
        return new LEMInterpreterValue("BOOLEAN", val);
    }
    else if(ast.op == "OR") {
        return new LEMInterpreterValue("BOOLEAN", lhs.asBoolean() || rhs.asBoolean());
    }
    else if(ast.op == "XOR") {
        return new LEMInterpreterValue("BOOLEAN", lhs.asBoolean() ^ rhs.asBoolean());
    }
    else if(ast.op == "AND") {
        return new LEMInterpreterValue("BOOLEAN", lhs.asBoolean() && rhs.asBoolean());
    }
    else {
        throw new Exception("b"); //TODO
    }
    
};

LEMInterpreter.prototype.visitIdentifier = function(ast, env) {
    if(!env.hasOwnProperty(ast.name)) {
        throw new Exception("Unbound identifier: " + ast.name);
    }
    var val = env[ast.name];
    return new LEMInterpreterValue("STRING", val);
};

LEMInterpreter.prototype.visitStringLiteral = function(ast, env) {
    return new LEMInterpreterValue("STRING", ast.text);
};

LEMInterpreter.prototype.visitRegexLiteral = function(ast, env) {
    return new LEMInterpreterValue("REGEX", ast.text);
};

LEMInterpreter.prototype.visitImplicitSearch = function(ast, env) {
    for(var key in env) {
        if(env[key].toLowerCase().contains(ast.text.toLowerCase())) {
            return new LEMInterpreterValue("BOOLEAN", true);
        }
    }
    return new LEMInterpreterValue("BOOLEAN", false);
};

function LEMInterpreterValue(type, val) {
    
    this.type = type;
    
    this.val = val;
}

LEMInterpreterValue.prototype.asString = function() {
    if(this.type != "STRING") {
        throw new Exception("S"); //TODO
    }
    return this.val;
};

LEMInterpreterValue.prototype.asBoolean = function() {
    if(this.type != "BOOLEAN") {
        throw new Exception("B"); //TODO
    }
    return this.val;
};