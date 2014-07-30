/**
 * Constructs a LEMTokenizer to tokenize the provided query
 * 
 * @classdesc
 * 
 * <p>
 * LEMTokenizer consumes a string of characters and divides into a list of
 * tokens. This is done according to the following grammar specified in Extended
 * Backus–Naur Form. Note that whitespace (as defined in the grammar) are not
 * considered tokens and will not be returned by this tokenizer
 * </p>
 * 
 * <p>
 * In the following definition, [] denotes an option and {} denotes repetition.
 * </p>
 * 
 * <pre>
 * input = 
 *     (token | whitespace), input
 *     
 * whitespace = 
 *     ' ' | '\t' | '\n' | '\r'
 *     
 * token = 
 *     one of the token types defined in LEMTokenType
 * </pre>
 * 
 * @constructor
 * @param {String} query
 */
function LEMTokenizer(query) {

    /** @private */
    this.stack = query.split("").reverse();

    /** @private */
    this.current = null;

    /** @private */
    this.startCharCount = this.stack.length;

    /** @private */
    this.symbolicTokens = TokenType.getSymbolicTokenStringSet();

    /** @private */
    this.textTokens = TokenType.getTextTokenStringSet();

}

/**
 * Gets the number of characters consumed by the tokenizer so far
 * 
 * @returns {Integer} The number of chars consumed
 */
LEMTokenizer.prototype.getNumCharsConsumed = function() {
    return this.startCharCount - this.stack.length;
};

/**
 * Returns true if there are more tokens to be read
 * 
 * @returns {Boolean} True if there are more tokens
 */
LEMTokenizer.prototype.hasNext = function() {
    if (this.current === null) {
        this.current = this.scan();
    }

    return this.current != null;
};

/**
 * Gets the next token and removes it from the stream of produced tokens
 * 
 * @returns {Token} The next token
 */
LEMTokenizer.prototype.next = function() {
    if (this.current != null) {
        var ret = this.current;
        this.current = null;
        return ret;
    }
    else {
        return this.scan();
    }
};

/**
 * Gets the next token but does not remove it.
 * 
 * @returns {Token} The next token
 */
LEMTokenizer.prototype.peek = function() {
    if (this.current == null) {
        this.current = this.scan();
    }

    return this.current;
};

/**
 * 
 * @returns {Token}
 */
LEMTokenizer.prototype.scan = function() {

    var context = this;

    while (hasNextChar() && isWhiteSpace(peek())) {
        pop();
    }

    if (!hasNextChar()) {
        return null;
    }

    if (isSymbolicToken(peek()) || isSymbolicToken(doublePeek())) {
        if (peek() == "/") {
            return scanGroup("/", TokenType.REGEX_LITERAL);
        }
        else if (peek() == "\"" || peek() == "'") {
            return scanGroup(peek(), TokenType.STRING_LITERAL);
        }
        else if (isSymbolicToken(doublePeek())) {
            var type = context.symbolicTokens[doublePeek()];
            var ret = new Token(type, doublePeek());
            pop();
            pop();
            return ret;
        }
        else if (isSymbolicToken(peek())) {
            var type = context.symbolicTokens[peek()];
            return new Token(type, pop());
        }
    }
    else if (isAlphaNumeric(peek())) {
        var tokenText = "";
        while (hasNextChar() && isAlphaNumeric(peek())) {
            tokenText += pop();
        }

        if (isTextToken(tokenText)) {
            return new Token(context.textTokens[tokenText], tokenText);
        }
        else {
            return new Token(TokenType.CHAR_SEQ, tokenText);
        }
    }
    else {
        throw new Exception("Invalid character: " + pop());
    }

    /*
     * 
     */
    function scanGroup(delim, type) {
        var tokenText = "";
        pop();
        while (hasNextChar() && peek() != delim) {
            tokenText += pop();
        }

        if (!hasNextChar()) {
            throw new Exception("Expected: " + delim);
        }

        pop();

        return new Token(type, tokenText);
    }

    /*
     * 
     */
    function isWhiteSpace(char) {
        return char == " " || char == "\n" || char == "\r" || char == "\t";
    }

    /*
     * 
     */
    function isAlphaNumeric(char) {
        return /^[a-z0-9]$/i.test(char);
    }

    /*
     * 
     */
    function isSymbolicToken(val) {
        return !!context.symbolicTokens[val];
    }

    /*
     * 
     */
    function isTextToken(val) {
        return !!context.textTokens[val];
    }

    /*
     * 
     */
    function peek() {
        return context.stack[context.stack.length - 1];
    }

    /*
     * 
     */
    function doublePeek() {
        var ret = peek();
        if (context.stack.length >= 2) {
            ret += context.stack[context.stack.length - 2];
        }
        return ret;
    }

    /*
     * 
     */
    function hasNextChar() {
        return context.stack.length != 0;
    }

    /*
     * 
     */
    function pop() {
        return context.stack.pop();
    }

};
