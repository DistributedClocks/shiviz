
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
    var lhs = ast.lhs.accept(this, env);
    var rhs = ast.rhs.accept(this, env);
    
    if(ast.op == BinaryOp.EQUALS || ast.op == BinaryOp.NOT_EQUALS) {
        var val = false;
        if(rhs.type == LEMInterpreterValue.REGEX) {
            var regex = new RegExp(rhs.val);
            val = regex.test(lhs.val);
        }
        else if(rhs.type == LEMInterpreterValue.STRING) {
            val = lhs.val == rhs.val;
        }
        else {
            throw new Exception("a"); //TODO
        }
        
        if(ast.op == LEMInterpreterValue.NOT_EQUALS) {
            val = !val;
        }
        
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, val);
    }
    else if(ast.op == BinaryOp.OR) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.val || rhs.val);
    }
    else if(ast.op == BinaryOp.XOR) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.val ^ rhs.val);
    }
    else if(ast.op == BinaryOp.AND) {
        return new LEMInterpreterValue(LEMInterpreterValue.BOOLEAN, lhs.val && rhs.val);
    }
    else {
        throw new Exception("b"); //TODO
    }
    
};

LEMInterpreter.prototype.visitIdentifier = function(ast, env) {
    if(!env.hasOwnProperty(ast.name)) {
        throw new Exception("Unbound identifier: " + ast.name);
    }
    var val = env[ast.name];
    return new LEMInterpreterValue(LEMInterpreterValue.STRING, val);
};

LEMInterpreter.prototype.visitStringLiteral = function(ast, env) {
    return new LEMInterpreterValue(LEMInterpreterValue.STRING, ast.text);
};

LEMInterpreter.prototype.visitRegexLiteral = function(ast, env) {
    return new LEMInterpreterValue(LEMInterpreterValue.REGEX, ast.text);
};

LEMInterpreter.prototype.visitImplicitSearch = function(ast, env) {
    for(var key in env) {
        if(env[key].toLowerCase().indexOf(ast.text.toLowerCase()) >= 0) {
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
