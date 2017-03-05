/**
 * Construct strings consisting of prefix and a root.
 * 
 * @class
 * 
 * @constructor
 * @param {String} prefix
 * @param {String} root
 */
function PrefixString(prefix, root) {
    // @private
    this.prefix = prefix;

    // @private
    this.root = root;
}

/** The minimum number of characters of either the prefix or the root that will
 * always be returned when ellipsifying.
 */
PrefixString.MIN_TEXT_LEN = 3;

/**
 * Returns the original string with prefix and root joined.
 */
PrefixString.prototype.complete = function() {
    return this.prefix + this.root;
};


/**
 * Given the number of characters to omit from the middle of the word,
 * removes them first from the prefix
 * and then (once reaching PrefixString.MIN_TEXT_LEN, removes them from
 * the root until it is at min length, and then removes no more). Returns the
 * resultant string with "..." in the place of the omitted letters. 
 * 
 * @param {integer} omitLen - the number of characters to omit
 * @returns {String}
 */
PrefixString.prototype.ellipsify = function(omitLen) {
    var prefix = this.prefix;
    var root = this.root;
    if (omitLen > 0) {
        var visiblePrefixLen = this.prefix.length - omitLen;
        if (visiblePrefixLen >= PrefixString.MIN_TEXT_LEN) {
            prefix = this.prefix.slice(0, -omitLen);
            root = this.root;
        } else {
            prefix = this.prefix.slice(0, PrefixString.MIN_TEXT_LEN);
            var overflow = PrefixString.MIN_TEXT_LEN - visiblePrefixLen;
            var visibleRootLen = this.root.length - overflow;
            var rootOmitLen = visibleRootLen >= PrefixString.MIN_TEXT_LEN ?
                              overflow :
                              -PrefixString.MIN_TEXT_LEN;
            root = this.root.slice(rootOmitLen);
        }
    }
    return prefix + "..." + root;
};

/**
 * @class
 *
 * A subtype of PrefixString. Provides the same funcationality, but with a
 * suffix instead of a prefix.
 *
 * @constructor
 * @param {String} root
 * @param {String} suffix
 */
function SuffixString(root, suffix) {
    PrefixString.call(this,
        Util.reverseString(suffix),
        Util.reverseString(root));
}
SuffixString.prototype = Object.create(PrefixString.prototype);

SuffixString.prototype.complete = function() {
    var result = PrefixString.prototype.complete.call(this);
    return Util.reverseString(result);
};

SuffixString.prototype.ellipsify = function(omitLen) {
    var result = PrefixString.prototype.ellipsify.call(this, omitLen);
    return Util.reverseString(result);
};
