/**
 * Constructs a parser to parse the tokens provided by the given tokenizer
 * 
 * @classdesc
 * 
 * <p>
 * LEMParser is a
 * {@link http://en.wikipedia.org/wiki/Recursive_descent_parser recursive descent parser}
 * that consumes a stream of tokens (provided by a {@link LEMTokenizer}) and
 * produces an {@link AST abstract syntax tree} according to the following
 * syntactic grammar, shown in
 * {@link http://en.wikipedia.org/wiki/Ebnf Extended Backus-Naur Form}. The
 * grammar is equivalent to an LL(1) grammar, but is not quite LL(1) in the form
 * shown below
 * </p>
 * 
 * <p>
 * In the following definition, [] denotes an option and {} denotes repetition.
 * Words in all caps denote terminal tokens as defined in {@link TokenType}
 * </p>
 * 
 * <pre>
 * expression = 
 *     expressionContents, {[binaryBooleanOperator], expressionContents}
 * 
 * expressionContents = 
 *     L_PAREN, expression, R_PAREN
 *     | implicitSearch
 *     | identifier, (EQ | NE), literalOrRef
 * 
 * literalOrRef =
 *     DOLLAR, identifier
 *     | literal
 * 
 * literal =
 *     stringLiteral | REGEX_LITERAL
 * 
 * identifier =
 *     CHAR_SEQ
 * 
 * stringLiteral = 
 *     CHAR_SEQ | STRING_LITERAL
 * 
 * implicitSearch = 
 *     stringLiteral
 *     
 * binaryBooleanOperator = 
 *     PIPE | AMP | CARET
 * </pre>
 * 
 * @constructor
 * @param {LEMTokenizer} tokenizer
 */
function LEMParser(tokenizer) {

    /** @private */
    this.tokenizer = tokenizer;

    /** @private */
    this.result = null;

}

/**
 * Parses the stream of tokens into an abstract syntax tree
 * 
 * @returns {AST} The abstract syntax tree parsed from the stream of tokens
 */
LEMParser.prototype.parse = function() {

    var context = this;

    if (this.result != null) {
        return this.result;
    }

    var ast = parseExpression();

    if (this.tokenizer.hasNext()) {
        throw new Exception("Expected: end of input");
    }

    return ast;

    function parseExpression() {
        var curr = parseExpressionContents();
        while (context.tokenizer.hasNext()) {
            if (checkAdvance(TokenType.PIPE) && checkAdvance(TokenType.PIPE)) {
                curr = new BinaryOp(BinaryOp.OR, curr, parseExpressionContents());
            }
            else if (checkAdvance(TokenType.CARET)) {
                curr = new BinaryOp(BinaryOp.XOR, curr, parseExpressionContents());
            }
            else if (checkAdvance(TokenType.AMP) && checkAdvance(TokenType.AMP)) {
                curr = new BinaryOp(BinaryOp.AND, curr, parseExpressionContents());
            }
            else if (check(TokenType.L_PAREN, TokenType.CHAR_SEQ, TokenType.STRING_LITERAL)) {
                curr = new BinaryOp(BinaryOp.AND, curr, parseExpressionContents());
            }
            else {
                return curr;
            }
        }
        return curr;

    }

    function parseExpressionContents() {
        require(TokenType.L_PAREN, TokenType.CHAR_SEQ, TokenType.STRING_LITERAL);

        if (checkAdvance(TokenType.L_PAREN)) {
            var ret = parseExpression();
            requireAdvance(TokenType.R_PAREN);
            return ret;
        }
        else {
            if (check(TokenType.STRING_LITERAL)) {
                return new ImplicitSearch(advance().getText());
            }

            var charSeq = requireAdvance(TokenType.CHAR_SEQ);

            if (checkAdvance(TokenType.EQUAL)) {
                return new BinaryOp(BinaryOp.EQUALS, new Identifier(charSeq.getText()), parseLiteralOrRef());
            }
            else if (checkAdvance(TokenType.EXCLAMATION_EQUAL)) {
                return new BinaryOp(BinaryOp.NOT_EQUALS, new Identifier(charSeq.getText()), parseLiteralOrRef());
            }
            else {
                return new ImplicitSearch(charSeq.getText());
            }
        }
    }

    function parseLiteralOrRef() {
        if (checkAdvance(TokenType.DOLLAR)) {
            return parseIdentifier();
        }
        else {
            return parseLiteral();
        }
    }

    function parseIdentifier() {
        return new Identifier(requireAdvance(TokenType.CHAR_SEQ).getText());
    }

    function parseLiteral() {
        if (check(TokenType.REGEX_LITERAL)) {
            return new RegexLiteral(advance().getText());
        }
        else {
            return parseStringLiteral();
        }
    }

    function parseStringLiteral() {
        require(TokenType.CHAR_SEQ, TokenType.STRING_LITERAL);

        return new StringLiteral(advance().getText());
    }

    // ----------------------------------------------------------------------

    /*
     * Checks if the next token is the type specified by the argument and
     * advances if it does. Also returns true if the next token is the type
     * specified by the argument.
     */
    function checkAdvance(type) {
        if (check(type)) {
            advance();
            return true;
        }
        else {
            return false;
        }
    }

    /*
     * Requires that the next token is of the specified type, throwing an error
     * otherwise. The token stream is then advanced
     */
    function requireAdvance(type) {
        require(type);
        return advance();
    }

    /*
     * Gets the next token in the token stream and advances the stream.
     */
    function advance() {
        return context.tokenizer.next();
    }

    /*
     * Returns true if the next token's type is one of the arguments. This is an
     * infinite-arity function
     * 
     * @param {...TokenType} args
     */
    function check(args) {
        if (!context.tokenizer.hasNext()) {
            return false;
        }

        var currType = peekType();
        for (var i = 0; i < arguments.length; i++) {
            if (currType == arguments[i]) {
                return true;
            }
        }
        return false;
    }

    /*
     * Requires that the next token's type is one of the arugments. An error is
     * thrown otherwise This is an infinite-arity function
     * 
     * @param {...TokenType} args
     */
    function require(args) {
        if (context.tokenizer.hasNext()) {
            var currType = peekType();
            for (var i = 0; i < arguments.length; i++) {
                if (currType == arguments[i]) {
                    return;
                }
            }
        }

        var errString = "Expected: ";
        for (var i = 0; i < arguments.length; i++) {
            errString += arguments[i].getPrettyName() + " or ";
        }
        throw new Exception(errString.replace(/or $/, ""));
    }

    /*
     * Returns the type of the next token in the stream
     */
    function peekType() {
        return context.tokenizer.peek().getType();
    }

};