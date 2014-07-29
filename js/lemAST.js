function AST() {
    
}

AST.prototype.accept = function(visitor, pass) {
    
};


function BinaryOp(op, lhs, rhs) {
    
    this.op = op;
    
    this.lhs = lhs;
    
    this.rhs = rhs;
}

BinaryOp.AND = "AND";
BinaryOp.XOR = "XOR";
BinaryOp.OR = "OR";
BinaryOp.EQUALS = "EQUALS";
BinaryOp.NOT_EQUAL = "NOT_EQUALS";

BinaryOp.prototype.accept = function(visitor, pass) {
    return visitor.visitBinaryOp(this, pass);
};

BinaryOp.prototype.getOp = function() {
    return this.op;
};

BinaryOp.prototype.getLHS = function() {
    return this.lhs;
};

BinaryOp.prototype.getRHS = function() {
    return this.rhs;
};

function Identifier(name) {
    
    this.name = name;
}

Identifier.prototype.accept = function(visitor, pass) {
    return visitor.visitIdentifier(this, pass);
};

Identifier.prototype.getName = function() {
    return this.name;
};

function StringLiteral(text) {
    
    this.text = text;
}

StringLiteral.prototype.getText = function() {
    return this.text;
};

StringLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitStringLiteral(this, pass);
};

function RegexLiteral(text) {
    
    this.text = text;
}

RegexLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitRegexLiteral(this, pass);
};

RegexLiteral.prototype.getText = function() {
    return this.text;
};

function ImplicitSearch(text) {
    
    this.text = text;
}

ImplicitSearch.prototype.accept = function(visitor, pass) {
    return visitor.visitImplicitSearch(this, pass);
};

ImplicitSearch.prototype.getText= function() {
    return this.text;
};
