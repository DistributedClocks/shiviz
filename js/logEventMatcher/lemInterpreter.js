/**
 * Constructs an interpreter that uses the given ast
 * 
 * @classdesc
 * 
 * <p>
 * LEMInterpreter interprets a text query given its
 * {@link AST abstract syntax tree} form and a {@link LogEvent} to check.
 * </p>
 * 
 * <p>
 * Upon calling {@link LEMInterpreter#interpret}, this class uses its visitFoo
 * methods to traverse the provided AST. Thus, this class is part of the
 * {@link http://en.wikipedia.org/wiki/Visitor_pattern visitor pattern} and
 * implements the ASTVisitor interface.
 * </p>
 * 
 * @constructor
 * @param {AST} ast The abstract syntax tree that represents the query
 */
function LEMInterpreter(ast) {

    /** @private */
    this.ast = ast;

}

/**
 * Checks if the query associated with this LEMInterpreter matches the provided
 * LogEvent. This object's abstract syntax tree is interpreted using the
 * provided LogEvent's fields as the environment - the binding of identifiers to
 * values.
 * 
 * @param {LogEvent} logEvent The LogEvent to check
 * @returns {Boolean} True if the query represented by this.ast matches the
 *          provided log event
 */
LEMInterpreter.prototype.interpret = function(logEvent) {
    var env = logEvent.getFields();
    env["event"] = logEvent.getText(); // TODO
    var ret = this.ast.accept(this, env);
    return ret.val;
};

/**
 * <p>
 * Visits and interprets a {@link BinaryOp} in accordance with the visitor
 * pattern
 * </p>
 * 
 * <p>
 * This method always produces a boolean-valued {@link LEMInterpreterValue}.
 * The exact value of that boolean is the result of evaluating the binary
 * operation represented by the BinaryOp that this method is visiting. See
 * {@link BinaryOp} for information on the semantics of each operator.
 * </p>
 * 
 * @protected
 * @param {BinaryOp} ast
 * @param {Object<String, String>} env The environment - the binding of
 *            identifiers to values as pure-object mapping of strings to
 *            strings.
 * @returns {LEMInterpreterValue} The value resulting from visiting and handling
 *          the ast node.
 */
LEMInterpreter.prototype.visitBinaryOp = function(ast, env) {
    var lhs = ast.getLHS().accept(this, env);
    var rhs = ast.getRHS().accept(this, env);

    if (ast.getOp() == BinaryOp.EQUALS || ast.getOp() == BinaryOp.NOT_EQUALS) {
        var val = false;
        if (rhs.getType() == LEMInterpreterValue.REGEX) {
            val = rhs.getVal().test(lhs.getVal());
        }
        else if (rhs.getType() == LEMInterpreterValue.STRING) {
            val = (lhs.getVal() == rhs.getVal());
        }
        else {
            throw new Exception("RHS must be a regex or string.");
        }

        if (ast.getOp() == LEMInterpreterValue.NOT_EQUALS) {
            val = !val;
        }

        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, val);
    }
    else if (ast.getOp() == BinaryOp.OR) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.getVal() || rhs.getVal());
    }
    else if (ast.getOp() == BinaryOp.XOR) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.getVal() ^ rhs.getVal());
    }
    else if (ast.getOp() == BinaryOp.AND) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.getVal() && rhs.getVal());
    }
    else {
        throw new Exception("Invalid BinaryOp");
    }

};

/**
 * <p>
 * Visits and interprets an {@link Identifer} in accordance with the visitor
 * pattern
 * </p>
 * 
 * <p>
 * The value returned will be a string-valued {@link LEMInterpreterValue} whose
 * value is the value bound to the identifier represented by the
 * {@link Identifier} ast node that this method is visiting. If the identifier
 * is unbound in the current environment, an exception is thrown
 * </p>
 * 
 * @protected
 * @param {BinaryOp} ast
 * @param {Object<String, String>} env The environment - the binding of
 *            identifiers to values as pure-object mapping of strings to
 *            strings.
 * @returns {LEMInterpreterValue} The value resulting from visiting and handling
 *          the ast node.
 * @throws {Exception} an exception if the identifier does not exist in the
 *             current environment
 */
LEMInterpreter.prototype.visitIdentifier = function(ast, env) {
    var name = ast.getName();
    if (!env.hasOwnProperty(name)) {
        throw new Exception("Unbound identifier: " + name);
    }
    return new LEMInterpreterValue(LEMInterpreterValue.STRING, env[name]);
};

/**
 * <p>
 * Visits and interprets a {@link StringLiteral} in accordance with the visitor
 * pattern
 * </p>
 * 
 * <p>
 * The value returned will be a string-valued {@link LEMInterpreterValue} whose
 * value is the string literal represented by the {@link StringLiteral} ast node
 * this method is visiting.
 * </p>
 * 
 * @protected
 * @param {BinaryOp} ast
 * @param {Object<String, String>} env The environment - the binding of
 *            identifiers to values as pure-object mapping of strings to
 *            strings.
 * @returns {LEMInterpreterValue} The value resulting from visiting and handling
 *          the ast node.
 */
LEMInterpreter.prototype.visitStringLiteral = function(ast, env) {
    return new LEMInterpreterValue(LEMInterpreterValue.STRING, ast.getText());
};

/**
 * <p>
 * Visits and interprets a {@link RegexLiteral} in accordance with the visitor
 * pattern
 * </p>
 * 
 * <p>
 * The value returned will be a regex-valued {@link LEMInterpreterValue} whose
 * value is the regex literal represented by the {@link RegexLiteral} ast node
 * this method is visiting.
 * </p>
 * 
 * @protected
 * @param {BinaryOp} ast
 * @param {Object<String, String>} env The environment - the binding of
 *            identifiers to values as pure-object mapping of strings to
 *            strings.
 * @returns {LEMInterpreterValue} The value resulting from visiting and handling
 *          the ast node.
 */
LEMInterpreter.prototype.visitRegexLiteral = function(ast, env) {
    return new LEMInterpreterValue(LEMInterpreterValue.REGEX, ast.getRegex());
};

/**
 * <p>
 * Visits and interprets an {@link ImplicitSearch} in accordance with the
 * visitor pattern
 * </p>
 * 
 * <p>
 * The value returned will be boolean-valued {@link LEMInterpreterValue}. The
 * boolean value will be true if the {@link ImplictSearch}'s query can be
 * "found" in the environment. For a precise definition of found, see
 * {@link ImplicitSearch}
 * </p>
 * 
 * @protected
 * @param {BinaryOp} ast
 * @param {Object<String, String>} env The environment - the binding of
 *            identifiers to values as pure-object mapping of strings to
 *            strings.
 * @returns {LEMInterpreterValue} The value resulting from visiting and handling
 *          the ast node.
 */
LEMInterpreter.prototype.visitImplicitSearch = function(ast, env) {
    for (var key in env) {
        if (env[key].toLowerCase().indexOf(ast.getText().toLowerCase()) >= 0) {
            return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, true);
        }
    }
    return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, false);
};

/**
 * Constructs an LEMInterpreterValue of the specified type and value
 * 
 * @classdesc
 * 
 * LEMInterpreterValue represents a value produced during the interpretation of
 * an abstract syntax tree. It essentially just holds the type of the value
 * along with the actual value
 * 
 * @constructor
 * @param {*} type The type of the LEMInterpreterValue. This must be one of the
 *            constants defined in LEMInterpreterValue such as
 *            LEMInterpreterValue.REGEX
 * @param {*} val The value represented by this LEMInterpreterValue
 */
function LEMInterpreterValue(type, val) {

    /** @private */
    this.type = type;

    /** @private */
    this.val = val;
}

/** @const */
LEMInterpreterValue.REGEX = "REGEX";

/** @const */
LEMInterpreterValue.BOOLEAN = "BOOLEAN";

/** @const */
LEMInterpreterValue.STRING = "STRING";

/**
 * Gets the type of this LEMInterpreterValue
 * 
 * @returns {*} The type. This value will be one of the constants defined in
 *          LEMInterpreterValue such as LEMInterpreterValue.REGEX
 */
LEMInterpreterValue.prototype.getType = function() {
    return this.type;
};

/**
 * Gets the value of this LEMInterpreterValue
 * 
 * @returns {*} the value
 */
LEMInterpreterValue.prototype.getVal = function() {
    return this.val;
};
