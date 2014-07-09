function Exception(message, isUserFriendly) {
    this.rawString = "";
    this.htmlString = "";
    this._isUserFriendly = !!isUserFriendly;
    
    this.append(message);
}

Exception.prototype.setUserFriendly = function(val) {
    this._isUserFriendly = val;
};

Exception.prototype.isUserFriendly = function() {
    return this._isUserFriendly;
};

Exception.prototype.append = function(string, style) {
    this.rawString += string;
    this.htmlString += this.getHTML(string, style);
};

Exception.prototype.prepend = function(string, style) {
    this.rawString = string + this.rawString;
    this.htmlString = this.getHTML(string, style) + this.htmlString;
};

Exception.prototype.getMessage = function() {
    return this.rawString;
};

Exception.prototype.getHTMLMessage = function() {
    return this.htmlString;
};

Exception.prototype.getHTML = function(string, style) {
    string = string.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "</br>");
    if (!style) {
        return string;
    }
    if (style == 'bold') {
        return "<b>" + string + "</b>";
    }
    if (style == "italic") {
        return "<em>" + string + "</em>";
    }
    if (style == "code") {
        return "<code>" + string + "</code>";
    }
    throw new Exception("Exception.prototype.getHTML: Invalid style argument."); 
};
