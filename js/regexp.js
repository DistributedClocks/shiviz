/**
 * @clasdesc
 * 
 * A RegExp extension that allows named capture groups in the syntax /(?<name>regexp)/
 * 
 * @constructor
 * @param {String} regexp a string describing a regular expression. All
 *        backslashes must be escaped, e.g. \\d
 * @param {String} flags a string of regexp flags, e.g. "mi" for multiline
 *        case-insensitive
 */
function NamedRegExp(regexp, flags) {
    var match, names = [];
    flags = flags || "";

    this.no = new RegExp(regexp.replace(/\(\?<\w+?>(.+?)\)/g, "\(\?\:$1\)"), "g" + flags);

    regexp = regexp.replace(/\((?!\?(=|!|<|:))/g, "(?:");
    while (match = regexp.match(/\(\?<(\w+?)>.+\)/)) {
        names.push(match[1]);
        regexp = regexp.replace(/\(\?<\w+?>(.+)\)/, '\($1\)');
    }

    this.reg = new RegExp(regexp, "g" + flags);
    this.names = names;
}

/**
 * Extension of RegExp.exec() Returns an extended array - first array element is
 * matching string, and elements thereafter are captured strings from regular
 * (non-named) groups. Named captures are extend upon arrays, e.g. for a name of
 * "date" the array will contain a property "date" with the captured string.
 * 
 * Multiple matches behave like RegExp.exec(), where each iteration of the call
 * produces the next match, or null if there are no more matches.
 * 
 * If there is no match for the regular expression, null is returned.
 * 
 * @param {String} string test string
 * @return {Array} array of match & captured matches, extended with named
 *         capture groups as object properties
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
 * @return {Boolean} whether a match was found or not
 */
NamedRegExp.prototype.test = function(string) {
    return this.no.test(string);
};