
function LogEventMatcher(query) {
    
 
}


function LEMTokenizer(query) {
    
    if(!LEMTokenizer.hasStaticInit) {
        LEMTokenizer.hasStaticInit = true;
        
        for(var key in LEMTokenizer.tokens) {
            if(LEMTokenizer.tokens[key] != null) {
                LEMTokeznier.tokenSet[LEMTokenizer.tokens[key]] = key;
            }
        }
    }
    
    this.stack = query.split("").reverse();
    
    this.current = null;
    
    this.scan();
    
}

LEMTokenizer.tokens = {
        "DOLLAR" : "$",
        "QUOTE" : "\"",
        "EXCLAMATION_EQUAL" : "!=",
        "EQUAL" : "=",
        "R_PAREN" : "(",
        "L_PAREN" : ")",
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

LEMTokenizer.prototype.hasNext = function() {
    return this.current != null;
};

LEMTokenizer.prototype.next = function() {
    var ret = this.current;
    this.scan();
    return ret;
};

LEMTokenizer.prototype.scan = function() {
    
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
                throw new Exception(); //TODO
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
                throw new Exception(); //TODO
            }
            
            this.stack.pop();
            
            this.current = new Token("STRING_LITERAL", tokenText);
        }
        else if(isToken(doublePeek())) {
            var type = LEMTokenizer.tokenSet[doublePeek()];
            this.current = new Token(type, doublePeek());
        }
        else if(isToken(peek())) {
            var type = LEMTokenizer.tokenSet[peek()];
            this.current = new Token(type, peek());
        }
    }
    else if (isAlphaNumeric(peek())) {
        var tokenText = "";
        while(isAlphaNumeric(peek())) {
            tokenText += this.stack.pop();
        }
        this.current = new Token("CHAR_SEQ", tokenText);
    }
    else {
        throw new Exception(); //TODO
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



function Parser(tokenizer) {
    
    this.tokenizer = tokenizer();
    
    this.result = null;
    
}

Parser.prototype.parse = function() {
    
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
        else if(context.tokenizer.hasNext()) {
            return new BinaryOp("AND", ret, parseExpression());
        }
        else {
            return ret;
        }
    }
    
    function parseExpressionContents() {
        require("L_PAREN", "CHAR_SEQ");
        
        if(checkAdvance("L_PAREN")) {
            var ret = parseExpression();
            requireAdvance("R_PAREN");
            return ret;
        }
        else {
            if(checkAdvance("STRING_LITERAL")) {
                return parseStringLiteral();
            }
            
            var charSeq = requireAdvance("CHAR_SEQ");
            
            if(checkAdvance("EQ")) {
                return BinaryOp("EQUALS", new Identifier(charSeq.text), parseLiteralOrRef());
            }
            else if(checkAdvance("NE")) {
                return BinaryOp("NOT_EQUALS", new Identifier(charSeq.text), parseLiteralOrRef());
            }
            else {
                return new StringLiteral(charSeq.text);
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
        return new Identifier(requireAdvance("CHAR_SEQ"));
    }
    
    function parseLiteral() {
        if(checkAdvance("REGEX_LITERAL")) {
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
        if(require(type)) {
            advance();
            return true;
        }
        else {
            return false;
        }
    }
    
    function requireAdvance(type) {
        if(!require(type)) {
            throw new Exception(); //TODO
        }
        return advance();
    }
    
    function advance() {
        return this.tokenizer.next();
    }
    
    function require() {
        var currType = peekType();
        for(var i = 0; i < arguments.length; i++) {
            if(currType == arguments[i]) {
                return true;
            }
        }
        return false;
    }
    
    function peekType() {
        return this.tokenizer.peek().type;
    }
    
//    expression = 
//        expressionContents, [[PIPE | AMP | CARET], expression]
//
//    expressionContents = 
//        L_PAREN, expression, R_PAREN
//        | stringLiteral
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


};


function LEMInterpreter(ast) {
    
    this.ast = ast;
    
}

LEMInterpreter.prototype.interpret = function(logEvent) {
    var env = logEvent.getFields();
    var ret = this.ast.visit(this, env);
    return ret.asBoolean();
};

LEMInterpreter.prototype.visitBinaryOp = function(ast, env) {
    var lhs = ast.lhs.accept(this, env);
    var rhs = ast.rhs.accept(this, env);
    
    if(ast.op == "EQUALS" || ast.op == "NOT_EQUALS") {
        var val = false;
        if(rhs.type == "REGEX") {
            var regex = new Regex(rhs.text);
            val = regex.match(lhs.asString());
        }
        else if(rhs.type == "STRING") {
            val = lhs.asString() == rhs.asString();
        }
        else {
            throw new Exception(); //TODO
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
        throw new Exception();
    }
};

LEMInterpreter.prototype.visitIdentifier = function(ast, env) {
    var val = env[ast.name];
    if(!val) {
        throw new Exception(); //TODO
    }
    return new LEMInterpreterValue("STRING", val);
};

LEMInterpreter.prototype.visitStringLiteral = function(ast, env) {
    return new LEMInterpreterValue("STRING", ast.text);
};

LEMInterpreter.prototype.visitRegexLiteral = function(ast, env) {
    return new LEMInterpreterValue("REGEX", ast.text);
};

function LEMInterpreterValue(type, val) {
    
    this.type = type;
    
    this.val = val;
}

LEMInterpreterValue.prototype.asString = function() {
    
};

LEMInterpreterValue.prototype.asBoolean = function() {
    // note: return raw bool
    // also need to convert string to bool by searching env
};