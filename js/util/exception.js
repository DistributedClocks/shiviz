/**
 * Constructs an Exception object that has the message specified.
 * 
 * @classdesc
 * 
 * Exceptions represent unexpected errors or circumstances that may be caught.
 * In Shiviz, you should ONLY ever throw Exception objects (as opposed to say,
 * raw strings). Exceptions contain a message that can be retrieved in HTML form
 * or as a raw string. The message can be either user-friendly or
 * non-user-friendly. A user-friendly message is one that would make sense to a
 * reasonable end-user who has no knowledge of Shiviz's internal workings.
 * 
 * @constructor
 * @param {String} message The message
 * @param {Boolean} isUserFriendly if true, this message is user-friendly
 */
function Exception(message, isUserFriendly) {

    /** @private */
    this.rawString = "";

    /** @private */
    this.htmlString = "";

    /** @private */
    this._isUserFriendly = !!isUserFriendly;

    if (message) {
        this.append(message);
    }
}

/**
 * Sets whether or not the message contained in this object is user-friendly. A
 * user-friendly message is one that would make sense to a reasonable end-user
 * who has no knowledge of Shiviz's internal workings.
 * 
 * @param {Boolean} val true if this should be set to user-friendly
 */
Exception.prototype.setUserFriendly = function(val) {
    this._isUserFriendly = val;
};

/**
 * Returns true if the message contained in this object is user-friendly. A
 * user-friendly message is one that would make sense to a reasonable end-user
 * who has knowledge of Shiviz's internal workings.
 * 
 * @returns {Boolean} true if user friendly
 */
Exception.prototype.isUserFriendly = function() {
    return this._isUserFriendly;
};

/**
 * Appends text to the message contained in this object. The new text will be
 * added after existing text
 * 
 * @param {String} string The message text to append
 * @param {?String} [style] The text style. Should be one of 'bold', 'italic',
 *            or 'code'. This parameter should be omitted or set to null if
 *            normal, unstyled text is desired
 */
Exception.prototype.append = function(string, style) {
    this.rawString += string;
    this.htmlString += this.getHTML(string, style);
};

/**
 * Prepends text to the message contained in this object. The new text will be
 * added before existing text
 * 
 * @param {String} string The message text to prepend
 * @param {String} style The text style. Should be one of 'bold', 'italic', or
 *            'code'. This parameter should be omitted if normal, unstyled text
 *            is desired
 */
Exception.prototype.prepend = function(string, style) {
    this.rawString = string + this.rawString;
    this.htmlString = this.getHTML(string, style) + this.htmlString;
};

/**
 * Gets the message contained as a raw string. The raw string ignored any text
 * style specified when appending or prepending text
 * 
 * @returns {String} the exception message
 */
Exception.prototype.getMessage = function() {
    return this.rawString;
};

/**
 * Gets the message as HTML. This will be an escaped piece of HTML code that can
 * be inserted into say, a div
 * 
 * @returns {String} the exception message
 */
Exception.prototype.getHTMLMessage = function() {
    return this.htmlString;
};

/**
 * @private
 * @param string
 * @param style
 */
Exception.prototype.getHTML = function(string, style) {
    string = string.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    if (!style) {
        return string;
    }
    if (style == 'bold') {
        return "<strong>" + string + "</strong>";
    }
    if (style == "italic") {
        return "<em>" + string + "</em>";
    }
    if (style == "code") {
        return "<pre>" + string + "</pre>";
    }

    throw new Exception("Exception.prototype.getHTML: Invalid style argument.");
};
