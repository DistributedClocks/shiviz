/**
 * 
 * @classdesc
 * 
 * @constructor
 * @param {LEMTokenizer} tokenizer
 */
function LEMParser(tokenizer) {
    
    this.tokenizer = tokenizer;
    
    this.result = null;
    
}

/**
 * 
 * @returns {AST}
 */
LEMParser.prototype.parse = function() {
    
    var context = this;

    if(this.result != null) {
        return this.result;
    }
    
    var ast = parseExpression();
    
    if(this.tokenizer.hasNext()) {
        throw new Exception("Expected: end of input");
    }
    
    return ast;
    
    /*
     * 
     */
    function parseExpression() {
        var curr = parseExpressionContents();
        while(context.tokenizer.hasNext()) {
            if(checkAdvance(TokenType.PIPE)) {
                curr = new BinaryOp(BinaryOp.OR, curr, parseExpressionContents());
            }
            else if(checkAdvance(TokenType.CARET)) {
                curr = new BinaryOp(BinaryOp.XOR, curr, parseExpressionContents());
            }
            else if(checkAdvance(TokenType.AMP)) {
                curr = new BinaryOp(BinaryOp.AND, curr, parseExpressionContents());
            }
            else if(check(TokenType.L_PAREN, TokenType.CHAR_SEQ, TokenType.STRING_LITERAL)) {
                curr = new BinaryOp(BinaryOp.AND, curr, parseExpressionContents());
            }
            else {
                return curr;
            }
        }
        return curr;

    }

    /*
     * 
     */
    function parseExpressionContents() {
        require(TokenType.L_PAREN, TokenType.CHAR_SEQ, TokenType.STRING_LITERAL);
        
        if(checkAdvance(TokenType.L_PAREN)) {
            var ret = parseExpression();
            requireAdvance(TokenType.R_PAREN);
            return ret;
        }
        else {
            if(check(TokenType.STRING_LITERAL)) {
                return new ImplicitSearch(advance().getText());
            }
            
            var charSeq = requireAdvance(TokenType.CHAR_SEQ);
            
            if(checkAdvance(TokenType.EQUAL)) {
                return new BinaryOp(BinaryOp.EQUALS, new Identifier(charSeq.getText()), parseLiteralOrRef());
            }
            else if(checkAdvance(TokenType.EXCLAMATION_EQUAL)) {
                return new BinaryOp(BinaryOp.NOT_EQUALS, new Identifier(charSeq.getText()), parseLiteralOrRef());
            }
            else {
                return new ImplicitSearch(charSeq.getText());
            }
        }
    }
    
    /*
     * 
     */
    function parseLiteralOrRef() {
        if(checkAdvance(TokenType.DOLLAR)) {
            return parseIdentifier();
        }
        else {
            return parseLiteral();
        }
    }
    
    /*
     * 
     */
    function parseIdentifier() {
        return new Identifier(requireAdvance(TokenType.CHAR_SEQ).getText());
    }
    
    /*
     * 
     */
    function parseLiteral() {
        if(check(TokenType.REGEX_LITERAL)) {
            return new RegexLiteral(advance().getText());
        }
        else {
            return parseStringLiteral();
        }
    }
    
    /*
     * 
     */
    function parseStringLiteral() {
        require(TokenType.CHAR_SEQ, TokenType.STRING_LITERAL);
        
        return new StringLiteral(advance().getText());
    }
    
    // ----------------------------------------------------------------------
    
    /*
     * 
     */
    function checkAdvance(type) {
        if(check(type)) {
            advance();
            return true;
        }
        else {
            return false;
        }
    }
    
    /*
     * 
     */
    function requireAdvance(type) {
        require(type);
        return advance();
    }
    
    /*
     * 
     */
    function advance() {
        return context.tokenizer.next();
    }
    
    /*
     * 
     */
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
    
    /*
     * 
     */
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
            errString += arguments[i].getPrettyName() + " or ";
        }
        throw new Exception(errString.replace(/or $/, ""));
    }
    
    /*
     * 
     */
    function peekType() {
        return context.tokenizer.peek().getType();
    }
    
    
//    change to:
//        expression = 
////          expressionContents, {[PIPE | AMP | CARET], expressionContents}
//  //
    
    
//    expression = 
//        expressionContents, {[PIPE | AMP | CARET], expressionContents}
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