/**
 * The constructor for this abstract class may be called by extending classes
 * 
 * @classdesc
 * 
 * <p>
 * This is the abstract class for
 * {@link http://en.wikipedia.org/wiki/Abstract_syntax_tree abstract syntax tree}
 * elements that define a text query.
 * </p>
 * 
 * <p>
 * This class is (and hence all of its subclasses are) part of the
 * {@link http://en.wikipedia.org/wiki/Visitor_pattern visitor pattern}, which
 * is realized by the {@link AST#accept} method.
 * </p>
 * 
 * @constructor
 * @abstract
 */
function AST() {

    if (this.constructor == AST) {
        throw new Exception("Cannot instantiate AST; AST is an abstract class");
    }
}

/**
 * This method realizes the
 * {@link http://en.wikipedia.org/wiki/Visitor_pattern visitor pattern}. As
 * this is an abstract method, subclasses must override this method in a manner
 * consistent with the visitor pattern
 * 
 * @abstract
 * @param {ASTVisitor} visitor
 * @param {*} pass
 */
AST.prototype.accept = function(visitor, pass) {

};

// ----------------------------------------------------------------------

/**
 * Constructs a BinaryOp whose operator is op and whose left and right operands
 * are lhs and rhs.
 * 
 * @classdesc
 * 
 * A node in the abstract syntax tree that represents a binary operation.
 * 
 * @constructor
 * @extends AST
 * @param {*} op The binary operator associated with this ast. This parameter
 *        must be one of the constants defined in the BinaryOp class such as
 *        BinaryOp.AND
 * @param {AST} lhs The left hand side operand
 * @param {AST} rhs The right hand side operand
 */
function BinaryOp(op, lhs, rhs) {

    /** @private */
    this.op = op;

    /** @private */
    this.lhs = lhs;

    /** @private */
    this.rhs = rhs;
}

/** @const */
BinaryOp.AND = "AND";

/** @const */
BinaryOp.XOR = "XOR";

/** @const */
BinaryOp.OR = "OR";

/** @const */
BinaryOp.EQUALS = "EQUALS";

/** @const */
BinaryOp.NOT_EQUAL = "NOT_EQUALS";

/**
 * Overrides {@link AST#accept}
 */
BinaryOp.prototype.accept = function(visitor, pass) {
    return visitor.visitBinaryOp(this, pass);
};

/**
 * Gets the operator associated with this binary operation. The returned value
 * will be one of the constants defined in the BinaryOp class such as
 * BinaryOp.AND
 * 
 * @returns {*} The operator
 */
BinaryOp.prototype.getOp = function() {
    return this.op;
};

/**
 * Gets the left hand side operand associated with this binary operation
 * 
 * @returns {AST} The left hand side operand
 */
BinaryOp.prototype.getLHS = function() {
    return this.lhs;
};

/**
 * Gets the right hand side operand associated with this binary operation
 * 
 * @returns {AST} The right hand side operand
 */
BinaryOp.prototype.getRHS = function() {
    return this.rhs;
};

// ----------------------------------------------------------------------

/**
 * Constructs an identifier whose name is the parameter
 * 
 * @classdesc
 * 
 * Identifier represents a reference to a value via its bound identifier
 * 
 * @constructor
 * @extends AST
 * @param {String} name The name of of the identifier
 */
function Identifier(name) {

    /** @private */
    this.name = name;
}

/**
 * Overrides {@link AST#accept}
 */
Identifier.prototype.accept = function(visitor, pass) {
    return visitor.visitIdentifier(this, pass);
};

/**
 * Gets the name of the identifer
 * 
 * @returns {String} the name of the identifier
 */
Identifier.prototype.getName = function() {
    return this.name;
};

// ----------------------------------------------------------------------

/**
 * Constructs a string literal whose value is the parameter
 * 
 * @classdesc
 * 
 * StringLiteral represents a literal string (i.e a string surrounded by quotes)
 * 
 * @constructor
 * @extends AST
 * @param {String} text the value of the stringliteral
 */
function StringLiteral(text) {

    /** @private */
    this.text = text;
}

/**
 * Overrides {@link AST#accept}
 */
StringLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitStringLiteral(this, pass);
};

/**
 * Gets the value of the string literal
 * 
 * @returns {String} the string literal value
 */
StringLiteral.prototype.getText = function() {
    return this.text;
};

// ----------------------------------------------------------------------

/**
 * Constructs a regular expression from the parameter
 * 
 * @classdesc
 * 
 * This class represents a literal regular expression.
 * 
 * @constructor
 * @extends AST
 * @param {String} text the regex in text form
 */
function RegexLiteral(text) {

    try {
        /** @private */
        this.regex = new RegExp(text);
    }
    catch (e) {
        throw new Exception("The regular expression " + text + " is not valid.");
    }
}

/**
 * Overrides {@link AST#accept}
 */
RegexLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitRegexLiteral(this, pass);
};

/**
 * Gets the regular expression as a Javascript RegExp object
 * 
 * @returns {RegExp} The regular expression
 */
RegexLiteral.prototype.getRegex = function() {
    return this.regex;
};

// ----------------------------------------------------------------------

/**
 * Constructs an implicit search with the parameter as the search query
 * 
 * @classdesc
 * 
 * This class represents a search over all of a logEvent's fields
 * 
 * @constructor
 * @extends AST
 * @param {String} text The query text
 */
function ImplicitSearch(text) {

    /** @private */
    this.text = text;
}

/**
 * Overrides {@link AST#accept}
 */
ImplicitSearch.prototype.accept = function(visitor, pass) {
    return visitor.visitImplicitSearch(this, pass);
};

/**
 * Gets the search query
 * 
 * @returns {String} The search query
 */
ImplicitSearch.prototype.getText = function() {
    return this.text;
};
