/**
 * 
 * <p>
 * Manages suffixes and prefixes of a string. A string can have either
 * a prefix or a suffix, but not both.
 * </p>
 *
 * @param prefix String
 * @param root   String
 * @param suffix String
 * 
 */
function Abbreviation(prefix, root, suffix) {
    this.originalString = prefix + root + suffix;

    if (root !== "") {
        this.prefix = prefix;
        this.root = root;
        this.suffix = suffix;
    } else if (prefix !== "") {
        this.prefix = "";
        this.root = prefix
        this.suffix = suffix;
    } else {
        this.prefix = "";
        this.root = suffix
        this.suffix = "";
    }

    this.displayRoot = this.root; // what is displayed during Ellipsification
    this.truncateLeftNext = false; // flag to keep track of truncation state

    console.assert(this.root !== "" || this.getOriginalString() === "",
        "this.root assigned an empty string when a non-empty is available");
}

Abbreviation.MIN_AFFIX_LEN = 3;
Abbreviation.ELLIPSIS = "..";

/**
 * Returns the original, unabbreviated string
 */
Abbreviation.prototype.getOriginalString = function () {
    return this.originalString;
}
/**
 * Returns the abbreviated string with ellipses in place of affixes.
 */
Abbreviation.prototype.getEllipsesString = function () {
    if (this.displayRoot === "") {
        // Since the affixes are always ellipsified, this prevents two
        // ellipses from appearing next to each other.
        return Abbreviation.ELLIPSIS;
    }
    const pre = this.isLeftTruncated() ? Abbreviation.ELLIPSIS : "";
    const suf = this.isRightTruncated() ? Abbreviation.ELLIPSIS : "";
    return pre + this.displayRoot + suf;
}

/*
 * @returns boolean
 */
Abbreviation.prototype.hasPrefix = function () {
    return this.prefix !== "";
}

/*
 * @returns boolean
 */
Abbreviation.prototype.hasSuffix = function () {
    return this.suffix !== "";
}

/**
 * The length of the string, without ellispses, that would be returned on a call
 * to getEllipsesString().
 *
 * @returns number
 */
Abbreviation.prototype.getDisplayLength = function() {
    return this.displayRoot.length;
}

/**
 * Returns true if the left side of the Abbreviation will be truncated on a call
 * to getEllipsesString (either via a prefix or a direct truncation of the root)
 *
 * @returns boolean
 */
Abbreviation.prototype.isLeftTruncated = function () {
    if (this.hasPrefix()) {
        return true;
    }
    if (this.root.length > 0) {
        const displayExists = this.displayRoot.length > 0;
        const firstCharactersAreSame =
            this.root.charAt(0) === this.displayRoot.charAt(0);
        return !(displayExists && firstCharactersAreSame);
    }
    return false;
}

/**
 * Returns true if the right side of the Abbreviation will be truncated on a call
 * to getEllipsesString (either via a suffix or a direct truncation of the root)
 *
 * @returns boolean
 */
Abbreviation.prototype.isRightTruncated = function () {
    if (this.hasSuffix()) {
        return true;
    }
    if (this.root.length > 0) {
        const displayExists = this.displayRoot.length > 0;
        const lastCharactersAreSame =
            this.root.charAt(this.root.length-1) ===
                this.displayRoot.charAt(this.displayRoot.length-1);
        return !(displayExists && lastCharactersAreSame);
    }
    return false;
}

    

/**
 * Reduces the displayed length of the Abbreviation by 1 character, inserting
 * ellipses where necessary.
 */
Abbreviation.prototype.truncate = function() {
    if (this.hasPrefix()) {
        this.displayRoot = this.displayRoot.slice(1);
    } else if (this.hasSuffix()) {
        this.displayRoot = this.displayRoot.slice(0, -1);
    } else {
        if (this.truncateLeftNext) {
            this.displayRoot = this.displayRoot.slice(1);
        } else {
            this.displayRoot = this.displayRoot.slice(0, -1);
        }
        this.truncateLeftNext = !this.truncateLeftNext;
    }
}

/**
 * Generates a the truncated, affix-matched Abbreviations for the given strings
 * There will be one chosen affix, either a prefix or a suffix, which is
 * determined by looking at the characters in common at the beginning or end
 * of the string. Whichever character is the most common will be the start of
 * the affix for this group of strings. Note, that a prefix must be at least
 * Abbreviation.MIN_AFFIX_LEN characters long to become a prefix.
 *
 * After choosing that, the supplied fitter predicate functions will be used
 * to set to further truncate the strings so that they will fit in the given
 * display.
 *
 * See /test/test.js for some examples on how the abbreviation algorithm behaves,
 * including some possible weaknesses.
 *
 * @static
 * @param stringsToFitter Map(String : (string) => Boolean
 *                        A function that, given a string, returns true if it
 *                        isn't too long, and false if it is too long.
 *                        A side-effect that it changes the html is permissable.
 * @return [Abbreviation]
 */
Abbreviation.generateFromStrings = function (stringsToFitter) {
    // this must come first because otherwise during the truncating
    // phase, affix character positions may not line up properly
    const abbrevs = abbrevStrings(Array.from(stringsToFitter.keys()));
    for (let abbrev of abbrevs) {
        const isFit = stringsToFitter.get(abbrev.getOriginalString());
        while (!isFit(abbrev.getEllipsesString()) && abbrev.getDisplayLength() > 0) {
            abbrev.truncate();
        }
        console.assert(isFit(abbrev.getEllipsesString()),
            "Text box is too small to hold string '" +
            abbrev.getOriginalString() + "'");
    }
    return abbrevs;

    // [String] => [Abbreviation]
    function abbrevStrings(strings) {
        const abbrevs = [];

        const prefixInfo = findPrefix(strings);
        const suffixInfo = findSuffix(strings);

        // Can only have prefix OR suffix, not both.
        // Choosing between them by selecting affix which is more common.
        let prefix, suffix;
        if (prefixInfo.count >= suffixInfo.count) {
            prefix = prefixInfo.prefix; 
            suffix = "";
        } else {
            prefix = "";
            suffix = suffixInfo.suffix; 
        }
        
        for (let str of strings) {
            let pre = "";
            let root = str;
            let suf = "";
            if (prefix !== "" && root.startsWith(prefix)) {
                root = root.slice(prefix.length); 
                pre = prefix;
            }
            if (suffix !== "" && root.endsWith(suffix))  {
                root = root.slice(0, -suffix.length); 
                suf = suffix;
            }
            let abbrev = new Abbreviation(pre, root, suf);
            abbrevs.push(abbrev);
        }

        return abbrevs;


        // [String] => {suffix: String; count: Number}
        function findSuffix(strings) {
            let revStrings = strings.map(Util.reverseString);
            let revSuffixInfo = findPrefix(revStrings);
            let suffix = Util.reverseString(revSuffixInfo.prefix);
            return {
                suffix: suffix,
                count: revSuffixInfo.count,
            };
        }

        // [String] => {prefix: String; count: Number}
        function findPrefix(strings) {
            let more = true;
            let i = 0;
            let prefixedStrings = strings;

            let prevMaxCount = 0;
            let prevMaxBucket = strings;
            while (more) {
                more = false;
                let buckets = new Map();
                for (let str of prevMaxBucket) {
                    let char = str.charAt(i);
                    if (char !== "") {
                        more = true;
                        let bucket = buckets.get(char);
                        bucket = bucket === undefined ? [] : bucket; 
                        bucket.push(str);
                        buckets.set(char, bucket);
                    }
                }
                let maxCount = 0;
                let maxBucket = [];
                for (let [char, bucket] of buckets) {
                    if (bucket.length > maxCount) {
                        maxCount = bucket.length;
                        maxBucket = bucket;
                    }
                }
                if (maxCount >= prevMaxCount) {
                    prevMaxCount = maxCount;
                    prevMaxBucket = maxBucket;
                    i++;
                } else {
                    more = false;
                }
            }
            
            let prefix = "";
            if (prevMaxBucket.length > 1) {
                // Must be > 1, or else it will find unique prefixes
                prefix = prevMaxBucket[0].slice(0, i); 
            }
            if (prefix.length < Abbreviation.MIN_AFFIX_LEN) {
                prefix = "";
            }
            return {
                prefix: prefix,
                count: prevMaxBucket.length,
            };
        }
    }


}
