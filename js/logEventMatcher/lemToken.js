/**
 * Constructs a token with the specified type and text
 * 
 * @classdesc
 * 
 * This class represents a token used in performing a text query. Tokens are
 * produced by {@link LEMTokenizer}s from the raw query string and consumed by
 * a {@link LEMParser}. Each token comprises a type and text. The type is a
 * {@link TokenType} enum instance and specifies the type of the token. The text
 * is a string and is the texual representation of the token.
 * 
 * @constructor
 * @param {TokenType} type The type of the token
 * @param {String} text The texual representation of the token
 */
function Token(type, text) {

    /** @private */
    this.type = type;

    /** @private */
    this.text = text;

    if (type.getText() != null && type.getText() != text) {
        throw new Exception("Token constructor: the text argument must match the TokenType's text if the TokenType has a set text");
    }
}

/**
 * Gets the type of the token
 * 
 * @returns {TokenType} The token type
 */
Token.prototype.getType = function() {
    return this.type;
};

/**
 * Gets the texual representation of the token
 * 
 * @returns {String} The token text
 */
Token.prototype.getText = function() {
    return this.text;
};

// ----------------------------------------------------------------------

/**
 * The constructor for this enum should never be used outside of the TokenType
 * class
 * 
 * @classdesc
 * 
 * <p>
 * TokenType is an enum. A TokenType specifies the type of a token. The
 * different token types are the differnt terminal tokens in the syntactic
 * grammar defined in {@link LEMParser}
 * </p>
 * 
 * <p>
 * Each TokenType has one or more texual representations. TokenTypes such as
 * TokenType.PIPE (aka the | character) have only one texual representation.
 * Other token types such as string literals have multiple or even an inifinite
 * number of possible texual representations.
 * </p>
 * 
 * <p>
 * Tokens can be either text-based or symbolic. For example, TokenType.AND
 * ("and") is text-based whereas TokenType.EQUAL ("=") is symbolic
 * </p>
 * 
 * @constructor
 * @param {String} text The texual representation of the token
 * @param {?Boolean} [isText]
 * @param {?String} [prettyName]
 */
function TokenType(text, isText, prettyName) {

    /** @private */
    this.text = text;

    /** @private */
    this.isText = !!isText;

    /** @private */
    this.prettyName = prettyName || text;
}

/**
 * @const
 * @static
 */
TokenType.DOLLAR = new TokenType("$");

/**
 * @const
 * @static
 */
TokenType.EXCLAMATION_EQUAL = new TokenType("!=");

/**
 * @const
 * @static
 */
TokenType.EQUAL = new TokenType("=");

/**
 * @const
 * @static
 */
TokenType.L_PAREN = new TokenType("(");

/**
 * @const
 * @static
 */
TokenType.R_PAREN = new TokenType(")");

/**
 * @const
 * @static
 */
TokenType.PIPE = new TokenType("|");

/**
 * @const
 * @static
 */
TokenType.AMP = new TokenType("&");

/**
 * @const
 * @static
 */
TokenType.CARET = new TokenType("^");

/**
 * CHAR_SEQ = / [a-zA-Z0-9]* /
 * 
 * @const
 * @static
 */
TokenType.CHAR_SEQ = new TokenType(null, true, "a sequence of characters");

/**
 * RegexLiteral = / \/[^\/]*\/ /
 * 
 * @const
 * @static
 */
TokenType.REGEX_LITERAL = new TokenType(null, true, "a regular expression");

/**
 * StringLiteral = / "[^"]*" /
 * 
 * @const
 * @static
 */
TokenType.STRING_LITERAL = new TokenType(null, true, "a string literal");

/**
 * Gets all valid token types
 * 
 * @static
 * @returns {Array<TokenType>} All valid token types as an array
 */
TokenType.getTokenTypes = function() {
    return [ //
    TokenType.DOLLAR, //
    TokenType.EXCLAMATION_EQUAL, //
    TokenType.EQUAL, //
    TokenType.L_PAREN, //
    TokenType.R_PAREN, //
    TokenType.PIPE, //
    TokenType.AMP, //
    TokenType.CARET, //
    TokenType.CHAR_SEQ, //
    TokenType.REGEX_LITERAL, //
    TokenType.STRING_LITERAL //
    ];
};

/**
 * @private
 * @static
 */
TokenType.hasStaticInit = false;

/**
 * @private
 * @static
 */
TokenType.symbolicTokenStringSet = {};

/**
 * @private
 * @static
 */
TokenType.textTokenStringSet = {};

/**
 * @private
 * @static
 */
TokenType.ensureStaticInit = function() {
    if (TokenType.hasStaticInit) {
        return;
    }

    TokenType.hasStaticInit = true;

    var tokenTypes = TokenType.getTokenTypes();
    for (var i = 0; i < tokenTypes.length; i++) {
        var tokenType = tokenTypes[i];

        if (!tokenType) {
            throw new Exception("LEMToken: one of the tokens in TokenType.getTokenTypes is undefined.");
        }

        if (tokenType.getText() == null) {
            return;
        }

        if (tokenType.getIsText()) {
            TokenType.textTokenStringSet[tokenType.getText()] = tokenType;
        }
        else {
            TokenType.symbolicTokenStringSet[tokenType.getText()] = tokenType;
        }
    }
};

/**
 * Returns a mapping of the texual representation of symbolic tokens to the
 * corresponding TokenType enum.
 * 
 * @static
 * @returns {Object<String, TokenType>}
 */
TokenType.getSymbolicTokenStringSet = function() {
    TokenType.ensureStaticInit();

    var ret = {};
    for (var key in TokenType.symbolicTokenStringSet) {
        ret[key] = TokenType.symbolicTokenStringSet[key];
    }
    return ret;
};

/**
 * Returns a mapping of the texual representation of text-based tokens to the
 * corresponding TokenType enum. TokenTypes that have multiple texual
 * representations are not included.
 * 
 * @static
 * @returns {Object<String, TokenType>}
 */
TokenType.getTextTokenStringSet = function() {
    TokenType.ensureStaticInit();

    var ret = {};
    for (var key in TokenType.textTokenStringSet) {
        ret[key] = TokenType.textTokenStringSet[key];
    }
    return ret;
};

/**
 * Gets the texual representation of this token type. If this token type has
 * multiple permissible texual representations (such as a string literal token
 * type), this method returns null
 * 
 * @returns {String} The texual representation of this type of token, or null if
 *          multiple exist
 */
TokenType.prototype.getText = function() {
    return this.text;
};

/**
 * Returns true if this token type is text-based as opposed to symbolic
 * 
 * @returns {Boolean} True if token type is text based
 */
TokenType.prototype.getIsText = function() {
    return this.isText;
};

/**
 * Returns the pretty name or display name of this token type. The pretty name
 * is one that would make sense to the end-user
 * 
 * @returns {String} The pretty name
 */
TokenType.prototype.getPrettyName = function() {
    return this.prettyName;
};
