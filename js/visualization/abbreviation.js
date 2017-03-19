/**
 * 
 * <p>
 * Manages suffixes and prefixes of a string.
 * </p>
 *
 * @param prefix String
 * @param root   String
 * @param suffix String
 * 
 */
function Abbreviation(prefix, root, suffix) {
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
    console.assert(this.root !== "" || this.getOriginalString() === "",
        "this.root assigned an empty string when a non-empty is available");
}

Abbreviation.ABBREV_CHARS = 3;
Abbreviation.ELLIPSIS = "..";

/**
 * Returns the original, unabbreviated string
 */
Abbreviation.prototype.getOriginalString = function () {
    return this.prefix + this.root + this.suffix;
}
/**
 * Returns the abbreviated string with ellipses in place of affixes.
 */
Abbreviation.prototype.getEllipsesString = function () {
    if (this.root === "") {
        return Abbreviation.ELLIPSIS;
    }

    const pre = ellipsify(this.prefix);
    const suf = ellipsify(this.suffix);
    return pre + this.root + suf;

    function ellipsify(string) {
        if (string.length < Abbreviation.ABBREV_CHARS) {
            return string;
        } else {
            return Abbreviation.ELLIPSIS;   
        }
    }
}

/*
 * The prefix drops its leftmost character, and gains one more character from
 * the root as its rightmost, if available. 
 */
Abbreviation.prototype.shiftPrefix = function () {
    if (this.root !== "") {
        this.prefix += this.root.charAt(0);
    }
    this.root = this.root.slice(1);
}

/*
 * The suffix drops its rightmost character, and gains one more character from
 * the root as its leftmost, if available. 
 */
Abbreviation.prototype.shiftSuffix = function () {
    if (this.root !== "") {
        const lastRootChar = this.root.charAt(this.root.length - 1);
        this.suffix = lastRootChar + this.suffix;
    }
    this.root = this.root.slice(0, -1);
}


/**
 * Generates a the truncated, affix-matched Abbreviations for the given strings
 * Static method
 *
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
        truncate(abbrev, stringsToFitter.get(abbrev.getOriginalString()));
    }
    return abbrevs;

    // [String] => [Abbreviation]
    function abbrevStrings(strings) {
        const abbrevs = [];

        const prefix = findPrefix(strings);
        const suffix = findSuffix(strings);

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


        // [String] => String
        function findSuffix(strings) {
            let revStrings = strings.map(Util.reverseString);
            let revSuffix = findPrefix(revStrings);
            let suffix = Util.reverseString(revSuffix);
            return suffix;
        }

        // [String] => String
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
            // Must be > 1, or else it will find unique prefixes
            if (prevMaxBucket.length > 1) {
                prefix = prevMaxBucket[0].slice(0, i); 
            }
            return prefix;
        }
    }


    function truncate(abbrev, isFit) {
        const leftAlways = abbrev.prefix !== "";
        const rightAlways = abbrev.suffix !== "";
        let isLeftNext = leftAlways;
        while (!isFit(abbrev.getEllipsesString())) {
            if (isLeftNext) {
                abbrev.shiftPrefix();
            } else {
                abbrev.shiftSuffix();
            }
            isLeftNext = leftAlways === rightAlways ?  
                isLeftNext = !isLeftNext :
                isLeftNext = leftAlways;
        }
        console.assert(abbrev.getEllipsesString() !== Abbreviation.ELLIPSIS_STRING,
            "text size is too small for '" + abbrev.getOriginalString() + "'");
    }

}
