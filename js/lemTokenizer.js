
function LEMTokenizer(query) {
    
    this.stack = query.split("").reverse();
    
    this.current = null;
    
    this.startCharCount = this.stack.length;
    
    this.symbolicTokens = TokenType.getSymbolicTokenStringSet();
    
    this.textTokens = TokenType.getTextTokenStringSet();
    
}


LEMTokenizer.prototype.getNumCharsConsumed = function() {
    return this.startCharCount - this.stack.length;
};

LEMTokenizer.prototype.hasNext = function() {
    if(this.current === null) {
        this.current = this.scan();
    }
    
    return this.current != null;
};

LEMTokenizer.prototype.next = function() {
    if(this.current != null) {
        var ret = this.current;
        this.current = null;
        return ret;
    }
    else {
        return this.scan();
    }
};

LEMTokenizer.prototype.peek = function() {
    if(this.current == null) {
        this.current = this.scan();
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
        return null;
    }
    
    if(isSymbolicToken(peek()) || isSymbolicToken(doublePeek())) {
        if(peek() == "/") {
            return scanGroup("/", TokenType.REGEX_LITERAL);
        }
        else if(peek() == "\"" || peek() == "'") {
            return scanGroup(peek(), TokenType.STRING_LITERAL);
        }
        else if(isToken(doublePeek())) {
            var type = context.symbolicTokens[doublePeek()];
            return new Token(type, doublePeek());
            this.stack.pop();
            this.stack.pop();
        }
        else if(isToken(peek())) {
            var type = context.symbolicTokens[peek()];
            return new Token(type, peek());
            this.stack.pop();
        }
    }
    else if (isAlphaNumeric(peek())) {
        var tokenText = "";
        while(hasNextChar() && isAlphaNumeric(peek())) {
            tokenText += this.stack.pop();
        }
        
        if(isTextToken(tokenText)) {
            return new Token(context.textTokens[tokenText], tokenText);
        }
        else {
            return new Token(TokenType.CHAR_SEQ, tokenText);
        }
    }
    else {
        throw new Exception("Invalid character: " + this.stack.pop());
    }
    
    
    function scanGroup(delim, type) {
        var tokenText = "";
        this.stack.pop();
        while(hasNextChar() && peek() != delim) {
            tokenText += this.stack.pop();
        }
        
        if(!hasNextChar()) {
            throw new Exception("Expected: " + delim);
        }
        
        this.stack.pop();
        
        return new Token(type, tokenText);
    }
        
    function isWhiteSpace(char) {
        return char == " " || char == "\n" || char == "\r" || char == "\t";
    }
    
    function isAlphaNumeric(char) {
        return /^[a-z0-9]$/i.test(char);
    }
    
    function isSymbolicToken(val) {
        return !!context.symbolicTokens[val];
    }
    
    function isTextToken(val) {
        return !!context.textTokens[val];
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

function TokenType(text, isText, prettyName) {
    
    this.text = text;
    
    this.isText = !!isText;
    
    this.prettyName = prettyName || name;
}

TokenType.DOLLAR = new TokenType("$"),
TokenType.QUOTE = new TokenType("\""),
TokenType.APOSTROPHE = new TokenType("'"),
TokenType.EXCLAMATION_EQUAL = new TokenType("!="),
TokenType.EQUAL = new TokenType("="),
TokenType.L_PAREN = new TokenType("("),
TokenType.R_PAREN = new TokenType(")"),
TokenType.PIPE = new TokenType("|"),
TokenType.AMP = new TokenType("&"),
TokenType.CARET = new TokenType("^"),
TokenType.SLASH = new TokenType("/"),
TokenType.CHAR_SEQ = new TokenType(null, true, "a sequence of characters"),
TokenType.REGEX_LITERAL = new TokenType(null, true, "a regular expression"),
TokenType.STRING_LITERAL = new TokenType(null, true, "a string literal"),

TokenType.getTokenTypes = function() {
    return [TokenType.DOLLAR, 
            TokenType.QUOTE,
            TokenType.APOSTROPHE,
            TokenType.EXCLAMATION_EQUAL,
            TokenType.EQUAL,
            TokenType.L_PAREN,
            TokenType.R_PAREN,
            TokenType.PIPE,
            TokenType.AMP,
            TokenType.CARET,
            TokenType.SLASH,
            TokenType.CHAR_SEQ,
            TokenType.REGEX_LITERAL,
            TokenType.STRING_LITERAL
            ];
};

TokenType.hasStaticInit = false;

TokenType.symbolicTokenStringSet = {};
TokenType.textTokenStringSet = {};

TokenType.ensureStaticInit = function() {
    if(TokenType.hasStaticInit) {
        return;
    }
    
    TokenType.hasStaticInit = true;
    
    var tokenTypes = TokenType.getTokenTypes();
    for(var i = 0; i < tokens.length; i++) {
        var tokenType = tokenTypes[i];
        
        if(tokenType.getText == null) {
            return;
        }
        
        if(tokenType.getIsText()) {
            TokenType.textTokenStringSet[tokenType.getText()] = tokenType;
        }
        else {
            TokenType.symbolicTokenStringSet[tokenType.getText()] = tokenType;
        }
    }
};

TokenType.getSymbolicTokenStringSet = function() {
    TokenType.ensureStaticInit();
    
    var ret = {};
    for(var key in TokenType.symbolicTokenStringSet) {
        ret[key] = TokenType.symbolicTokenStringSet[key];
    }
    return ret;
};

TokenType.getTextTokenStringSet = function() {
    TokenType.ensureStaticInit();
    
    var ret = {};
    for(var key in TokenType.textTokenStringSet) {
        ret[key] = TokenType.textTokenStringSet[key];
    }
    return ret;
};

TokenType.prototype.getName = function() {
    return this.name;
};

TokenType.prototype.getText = function() {
    return this.text;
};

TokenType.prototype.getIsText = function() {
    return this.isText;
};

TokenType.prototype.getPrettyName = function() {
    return this.prettyName;
};

function Token(type, text) {
    
    this.type = type;
    
    this.text = text;
}