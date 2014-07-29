
function LEMParser(tokenizer) {
    
    this.tokenizer = tokenizer;
    
    this.result = null;
    
}

LEMParser.prototype.parse = function() {
    
    var context = this;

    if(this.result != null) {
        return this.result;
    }
    
    var ret = parseExpression();
    
    if(this.tokenizer.hasNext()) {
        throw new Exception("Expected: end of input");
    }
    
    return ret;
    
    function parseExpression() {
        var ret = parseExpressionContents();
        if(checkAdvance(TokenType.PIPE)) {
            return new BinaryOp(BinaryOp.OR, ret, parseExpression());
        }
        else if(checkAdvance(TokenType.CARET)) {
            return new BinaryOp(BinaryOp.XOR, ret, parseExpression());
        }
        else if(checkAdvance(TokenType.AMP)) {
            return new BinaryOp(BinaryOp.AND, ret, parseExpression());
        }
        else if(check(TokenType.L_PAREN, TokenType.CHAR_SEQ, TokenType.STRING_LITERAL)) {
            return new BinaryOp(BinaryOp.AND, ret, parseExpression());
        }
        else {
            return ret;
        }
    }

    function parseExpressionContents() {
        require(TokenType.L_PAREN, TokenType.CHAR_SEQ, TokenType.STRING_LITERAL);
        
        if(checkAdvance(TokenType.L_PAREN)) {
            var ret = parseExpression();
            requireAdvance(TokenType.R_PAREN);
            return ret;
        }
        else {
            if(check(TokenType.STRING_LITERAL)) {
                return new ImplicitSearch(advance().text);
            }
            
            var charSeq = requireAdvance(TokenType.CHAR_SEQ);
            
            if(checkAdvance(TokenType.EQUAL)) {
                return new BinaryOp(BinaryOp.EQUALS, new Identifier(charSeq.text), parseLiteralOrRef());
            }
            else if(checkAdvance(TokenType.EXCLAMATION_EQUAL)) {
                return new BinaryOp(BinaryOp.NOT_EQUALS, new Identifier(charSeq.text), parseLiteralOrRef());
            }
            else {
                return new ImplicitSearch(charSeq.text);
            }
        }
    }
    
    function parseLiteralOrRef() {
        if(checkAdvance(TokenType.DOLLAR)) {
            return parseIdentifier();
        }
        else {
            return parseLiteral();
        }
    }
    
    function parseIdentifier() {
        return new Identifier(requireAdvance(TokenType.CHAR_SEQ).text);
    }
    
    function parseLiteral() {
        if(check(TokenType.REGEX_LITERAL)) {
            return new RegexLiteral(advance().text);
        }
        else {
            return parseStringLiteral();
        }
    }
    
    function parseStringLiteral() {
        require(TokenType.CHAR_SEQ, TokenType.STRING_LITERAL);
        
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