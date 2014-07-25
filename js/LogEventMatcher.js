
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


function BinaryOp(op, l, r) {
    
}

function Identifier(name) {
    
}

function StringLiteral(text) {
    
}

function RegexLiteral(text) {
    
}



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



