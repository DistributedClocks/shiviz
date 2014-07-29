function AST() {
    
}


function BinaryOp(op, lhs, rhs) {
    
    this.op = op;
    
    this.lhs = lhs;
    
    this.rhs = rhs;
}

BinaryOp.prototype.accept = function(visitor, pass) {
    return visitor.visitBinaryOp(this, pass);
};

function Identifier(name) {
    
    this.name = name;
}

Identifier.prototype.accept = function(visitor, pass) {
    return visitor.visitIdentifier(this, pass);
};

function StringLiteral(text) {
    
    this.text = text;
}

StringLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitStringLiteral(this, pass);
};

function RegexLiteral(text) {
    
    this.text = text;
}

RegexLiteral.prototype.accept = function(visitor, pass) {
    return visitor.visitRegexLiteral(this, pass);
};

function ImplicitSearch(text) {
    
    this.text = text;
}

ImplicitSearch.prototype.accept = function(visitor, pass) {
    return visitor.visitImplicitSearch(this, pass);
};
