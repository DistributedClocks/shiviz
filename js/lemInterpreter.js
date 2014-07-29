
function LEMInterpreter(ast) {
    
    this.ast = ast;
    
}

LEMInterpreter.prototype.interpret = function(logEvent) {
    var env = logEvent.getFields();
    env["event"] = logEvent.getText(); //TODO
    var ret = this.ast.accept(this, env);
    return ret.val;
};

LEMInterpreter.prototype.visitBinaryOp = function(ast, env) {
    var lhs = ast.getLHS().accept(this, env);
    var rhs = ast.getRHS().accept(this, env);
    
    if(ast.getOp() == BinaryOp.EQUALS || ast.getOp() == BinaryOp.NOT_EQUALS) {
        var val = false;
        if(rhs.getType() == LEMInterpreterValue.REGEX) {
            val = rhs.getRegex().test(lhs.getVal());
        }
        else if(rhs.getType() == LEMInterpreterValue.STRING) {
            val = lhs.getVal() == rhs.getVal();
        }
        else {
            throw new Exception("a"); //TODO
        }
        
        if(ast.getOp() == LEMInterpreterValue.NOT_EQUALS) {
            val = !val;
        }
        
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, val);
    }
    else if(ast.getOp() == BinaryOp.OR) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.getVal() || rhs.getVal());
    }
    else if(ast.getOp() == BinaryOp.XOR) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.getVal() ^ rhs.getVal());
    }
    else if(ast.getOp() == BinaryOp.AND) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.getVal() && rhs.getVal());
    }
    else {
        throw new Exception("b"); //TODO
    }
    
};

LEMInterpreter.prototype.visitIdentifier = function(ast, env) {
    var name = ast.getName();
    if(!env.hasOwnProperty(name)) {
        throw new Exception("Unbound identifier: " + name);
    }
    return new LEMInterpreterValue(LEMInterpreterValue.STRING, env[name]);
};

LEMInterpreter.prototype.visitStringLiteral = function(ast, env) {
    return new LEMInterpreterValue(LEMInterpreterValue.STRING, ast.getText());
};

LEMInterpreter.prototype.visitRegexLiteral = function(ast, env) {
    return new LEMInterpreterValue(LEMInterpreterValue.REGEX, ast.getText());
};

LEMInterpreter.prototype.visitImplicitSearch = function(ast, env) {
    for(var key in env) {
        if(env[key].toLowerCase().indexOf(ast.getText.toLowerCase()) >= 0) {
            return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, true);
        }
    }
    return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, false);
};

function LEMInterpreterValue(type, val) {
    
    this.type = type;
    
    this.val = val;
}

LEMInterpreterValue.REGEX = "REGEX";
LEMInterpreterValue.BOOLEAN = "BOOLEAN";
LEMInterpreterValue.STRING = "STRING";

LEMInterpreterValue.prototype.getType = function() {
    return this.type;
};

LEMInterpreterValue.prototype.getVal = function() {
    return this.val;
};
