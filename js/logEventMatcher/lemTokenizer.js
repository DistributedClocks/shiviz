/**
 * Constructs a LEMTokenizer to tokenize the provided query
 * 
 * @classdesc
 * 
 * <p>
 * LEMTokenizer consumes a string of characters and divides into a list of
 * tokens. This is done according to the following grammar specified in
 * {@link http://en.wikipedia.org/wiki/Ebnf Extended Backus-Naur Form}. Note
 * that whitespace (as defined in the grammar) are not considered tokens and
 * will not be returned by this tokenizer
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
 * @param {String} query The raw query string to tokenize
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
 * Gets the next token and removes it from the stream of produced tokens. If
 * there is no next token, this method returns null
 * 
 * @returns {Token} The next token or null if there is no next token
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
 * Gets the next token but does not remove it. If there is no next token, this
 * method returns null
 * 
 * @returns {Token} The next token or null if there is no next token
 */
LEMTokenizer.prototype.peek = function() {
    if (this.current == null) {
        this.current = this.scan();
    }

    return this.current;
};

/**
 * Retrieves the following token from the stream of characters. Note that this
 * is not the same as {@link LEMTokenizer#next}. The next token read from the
 * stream, removed, and cached whenever peek is called. The next() method will
 * return the cached token if there is one. This method returns the following
 * token from the character stream regardless of the state of the cache. Thus,
 * this method does not return the next token in the stream in general
 * 
 * @private
 * @returns {Token} The result of the scan
 */
LEMTokenizer.prototype.scan = function() {

    var context = this;

    while (hasNextChar() && isWhiteSpace(peek())) {
        pop();
    }

    if (!hasNextChar()) {
        return null;
    }

    var next = peek();
    if (next == "/") {
        return scanGroup("/", TokenType.REGEX_LITERAL);
    }
    else if (next == "\"" || next == "'") {
        return scanGroup(next, TokenType.STRING_LITERAL);
    }
    else if (isSymbolicToken(doublePeek())) {
        var type = context.symbolicTokens[doublePeek()];
        var ret = new Token(type, doublePeek());
        pop();
        pop();
        return ret;
    }
    else if (isSymbolicToken(next)) {
        var type = context.symbolicTokens[next];
        return new Token(type, pop());
    }
    else if (isAlphaNumeric(next)) {
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

    // ----------------------------------------------------------------------

    /*
     * Handles a group of characters surrounded by delimiters (e.g literal
     * strings are surrounded by quotes)
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
     * Returns true if char is whitespace
     */
    function isWhiteSpace(chr) {
        return chr == " " || chr == "\n" || chr == "\r" || chr == "\t";
    }

    /*
     * Returns true if char is alphanumeric OR an underscore
     */
    function isAlphaNumeric(chr) {
        return /^\w$/i.test(chr);
    }

    /*
     * Returns true if val is the text representation of a symbolic token
     */
    function isSymbolicToken(val) {
        return !!context.symbolicTokens[val];
    }

    /*
     * Returns true if val is the text representation of a text token
     */
    function isTextToken(val) {
        return !!context.textTokens[val];
    }

    /*
     * Returns the next character in the char stream
     */
    function peek() {
        return context.stack[context.stack.length - 1];
    }

    /*
     * Returns the next two characters in the char stream
     */
    function doublePeek() {
        var ret = peek();
        if (context.stack.length >= 2) {
            ret += context.stack[context.stack.length - 2];
        }
        return ret;
    }

    /*
     * True if there are more characters in the char stream
     */
    function hasNextChar() {
        return context.stack.length != 0;
    }

    /*
     * Removes a character from the char stream and returns it
     */
    function pop() {
        return context.stack.pop();
    }

};
