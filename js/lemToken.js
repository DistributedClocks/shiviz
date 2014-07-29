function TokenType(text, isText, prettyName) {
    
    this.text = text;
    
    this.isText = !!isText;
    
    this.prettyName = prettyName || name;
}

TokenType.DOLLAR = new TokenType("$");
TokenType.QUOTE = new TokenType("\"");
TokenType.APOSTROPHE = new TokenType("'");
TokenType.EXCLAMATION_EQUAL = new TokenType("!=");
TokenType.EQUAL = new TokenType("=");
TokenType.L_PAREN = new TokenType("(");
TokenType.R_PAREN = new TokenType(")");
TokenType.PIPE = new TokenType("|");
TokenType.AMP = new TokenType("&");
TokenType.CARET = new TokenType("^");
TokenType.SLASH = new TokenType("/");
TokenType.CHAR_SEQ = new TokenType(null, true, "a sequence of characters");
TokenType.REGEX_LITERAL = new TokenType(null, true, "a regular expression");
TokenType.STRING_LITERAL = new TokenType(null, true, "a string literal");

TokenType.getTokenTypes = function() {
    return [ //
            TokenType.DOLLAR, //
            TokenType.QUOTE, //
            TokenType.APOSTROPHE, //
            TokenType.EXCLAMATION_EQUAL, //
            TokenType.EQUAL, //
            TokenType.L_PAREN, //
            TokenType.R_PAREN, //
            TokenType.PIPE, //
            TokenType.AMP, //
            TokenType.CARET, //
            TokenType.SLASH, //
            TokenType.CHAR_SEQ, //
            TokenType.REGEX_LITERAL, //
            TokenType.STRING_LITERAL //
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