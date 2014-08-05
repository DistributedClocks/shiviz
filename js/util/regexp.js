/**
 * Constructs a NamedRegExp object
 * 
 * @clasdesc
 * 
 * A RegExp extension that allows named capture groups in the syntax /(?<name>regexp)/
 * 
 * @constructor
 * @param {String} regexp a string describing a regular expression. All
 *            backslashes must be escaped, e.g. \\d
 * @param {?String} [flags=""] a string of regexp flags, e.g. "mi" for multiline
 *            case-insensitive
 */
function NamedRegExp(regexp, flags) {
    var match, names = [];
    flags = flags || "";

    try {
        this.no = new RegExp(regexp.replace(/\(\?<\w+?>/g, "\(\?\:"), "g" + flags);

        regexp = regexp.replace(/\((?!\?(=|!|<|:))/g, "(?:");
        while (match = regexp.match(/\(\?<(\w+?)>.+\)/)) {
            if (names.indexOf(match[1]) > -1) {
                var exc = new Exception("The regular expression you entered was invalid.\n", true);
                exc.append("There are multiple capture groups named " + match[1]);
                throw exc;
            }
            else {
                names.push(match[1]);
            }

            regexp = regexp.replace(/\(\?<\w+?>/, '\(');
        }

        this.reg = new RegExp(regexp, "g" + flags);
    }
    catch (e) {
        if (e instanceof Exception)
            throw e;

        var exception = new Exception("The following regular expression entered was invalid.\n", true);
        exception.append(regexp, "code");
        exception.append("The error given by the browser is: \n");
        exception.append(e.message.replace(/(?:.*\/\:\s+)?(.*)/, "$1"), "code");
        throw exception;
    }

    /** @private */
    this.names = names;
}

/**
 * <p>
 * Extension of RegExp.exec() Returns an extended array - first array element is
 * matching string, and elements thereafter are captured strings from regular
 * (non-named) groups. Named captures are extend upon arrays, e.g. for a name of
 * "date" the array will contain a property "date" with the captured string.
 * </p>
 * 
 * <p>
 * Multiple matches behave like RegExp.exec(), where each iteration of the call
 * produces the next match, or null if there are no more matches.
 * </p>
 * 
 * <p>
 * If there is no match for the regular expression, null is returned.
 * </p>
 * 
 * @param {String} string test string
 * @returns {Array<String>} array of match & captured matches, extended with
 *          named capture groups as object properties. See documentation for
 *          js's
 *          {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
 *          built in regex} for more information
 */
NamedRegExp.prototype.exec = function(string) {
    var num = this.no.exec(string);
    var nam = this.reg.exec(string);

    if (nam && nam.length > 1)
        for (var i = 1; i < nam.length; i++) {
            num[this.names[i - 1]] = nam[i];
        }

    return num;
};

/**
 * Tests for a match, just like RegExp.test()
 * 
 * @param {String} string test string
 * @returns {Boolean} whether a match was found or not
 */
NamedRegExp.prototype.test = function(string) {
    return this.no.test(string);
};

/**
 * Gets array of capture group labels
 * 
 * @returns {Array<String>} Capture group labels
 */
NamedRegExp.prototype.getNames = function() {
    return this.names;
};