function Error(message) {
    this.rawString = message;
    this.htmlString = message;
    this.isUserFriendly = false;
}

Error.prototype.setIsUserFriendly = function(val) {
    this.isUserFriendly = val;
};

Error.prototype.getIsUserFriendly = function() {
    return this.isUserFriendly;
};

Error.prototype.append = function(string, style) {
    this.rawString += string;
    this.htmlString += this.getHTML(string, style);
};

Error.prototype.prepend = function(string, style) {
    this.rawString = string + this.rawString;
    this.htmlString = this.getHTML(string, style) + this.htmlString;
};

Error.prototype.getMessage = function() {
    return this.rawString;
};

Error.prototype.getHTMLMessage = function() {
    return this.htmlString;
};

Error.prototype.getHTML = function(string, style) {
    if(!style) {
        return string;
    }
    if(style == 'bold') {
        return "<b>" + string + "</b>";
    }
    if(style == "italic") {
        return "<em>" + string + "</em>";
    }
    if(style == "code") {
        return "<code>" + string + "</code>";
    }
    throw "Invalid style string";
};

