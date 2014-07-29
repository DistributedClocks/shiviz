
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
        else if(isSymbolicToken(doublePeek())) {
            var type = context.symbolicTokens[doublePeek()];
            var ret =  new Token(type, doublePeek());
            this.stack.pop();
            this.stack.pop();
            return ret;
        }
        else if(isSymbolicToken(peek())) {
            var type = context.symbolicTokens[peek()];
            return new Token(type, this.stack.pop());
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
        context.stack.pop();
        while(hasNextChar() && peek() != delim) {
            tokenText += context.stack.pop();
        }
        
        if(!hasNextChar()) {
            throw new Exception("Expected: " + delim);
        }
        
        context.stack.pop();
        
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
