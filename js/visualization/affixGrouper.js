/*
 * 
 * Classes for management of strings composed of common prefixes
 * or suffixes and unique portions.
 * 
 */


/**
 * 
 * @class
 *
 * An AffixGrouper should only be created by its subtypes.
 *
 */
function AffixGrouper() {

    /** @private */
    this.affixes = new Map();
}

AffixGrouper.createPrefixGroups = function(strings) {
    return AffixGrouper();
};

AffixGrouper.groupSuffixGroups = function(strings) {
    return AffixGrouper();
};


/**
 * Detemines groups strings based on either common prefix or common suffix,
 * whichever is longer, and returns a mapping of each original string to an
 * AffixGroup (either a PrefixGroup or a SuffixGroup).
 *
 * Implementation:
 * The current algorithm does this simply by ordering the strings, and comparing
 * each one to its two neighbours and taking the largest prefix it can find of
 * each -- provided the large one is more than 3 characters longer than the
 * other (this is to help prevent situations like "node-120" and "node-121"
 * having * the same prefix of "node-12", instead of "node-"
 * prefixes could be (e.g., the current algoirthm 
 *
 * Implementation:
 * 1. Order the strings
 * 2. For each string, find which of its two neighbours shares the longest
 * common prefix with it, and store that prefix in a set. A prefix must be at
 * least 3 characters long to be included.
 * 3. For each prefix in the prefix set, truncate it to the same prefix as its
 * neighbour if it does not extend its neighbour by at least three characters.
 * 4. Use this final set of prefixes to construct the prefixes of the original
 * list of strings.
 * 5. Repeat the same with the strings reversed to find the suffixes, and choose
 * the longer of the two for each string's AffixGroup.
 *
 * @param {strings} [String]
 * @returns [AffixGroup]
 */
AffixGrouper.groupLongestAffixes = function(strings) {
    const prefixCounts = measurePrefixes(strings);
    const suffixCounts = measureSuffixes(strings);
    const affixStrings = selectLongestAffixes(prefixCounts, suffixCounts);
    return affixStrings;
    
    function selectLongestAffixes(prefixCounts, suffixCounts) {
        const affixStrings = new Map();
        for (let string of prefixCounts.keys()) {
            if (prefixCounts.get(string) > suffixCounts.get(string)) {
                let pCount = prefixCounts.get(string);
                let prefix = string.slice(0, pCount);
                let root = string.slice(pCount);
                let prefixString = new PrefixString(prefix, root);
                affixStrings.set(string, prefixString);
            } else {
                let sCount = suffixCounts.get(string);
                let suffix = string.slice(-sCount);
                let root = string.slice(0, -sCount);
                let suffixString = new SuffixString(root, suffix);
                affixStrings.set(string, suffixString);
            }
        }
        return affixStrings;
    }

    function mesuresSuffixes(strings) {
        const revStrings = strings.map(s => Util.reverseString(s));
        const revCounts = measurePrefixes(revStrings);
        const suffixCounts = new Map();
        for (let [revString, count] of revCounts) {
            suffixCounts.set(revString.reverse(), count);
        }
        return suffixCounts;
    }

    function measurePrefixes(strings) {
        strings.sort();
        const prefixToStrings = selectLongestNeighbourPrefixes(strings);
        const prefixToNormalizedPrefix = normalizeByMinDif(
            prefixToStrings.keys(), PrefixString.MIN_TEXT_LEN);



        let prefixCounts = new Map();
        for (let [prefix, strs] of prefixes) {
            for (let s of strs) {
                prefixCounts[s] = prefix.length;
            }
        }

        function normalizeByMinDiff(strings, minDif) {
            strings.sort();
            let normalizedStrings = [];
            if (strings.length > 1) {
                for (let [i,j] = 0; i < strings.length-1; i++) {
                    let dif = charDifference(strings[i], strings[i+1]);

                     
                    if (dif < minDif) {
                        prefixToStrings[strings[i]].extend(prefixToStrings[strings[i+1]])
                        delete prefixToStrings[strings[i+1]]
                    }
                }
            }
            return strings
        }

        function selectLongestNeighbourPrefixes(strings) {
            const prefixToStrings = new Map();
            let i = 1;
            if (strings.length >= 3) {
                // Non-edge cases, where each string has 2 neighbours
                for (; i < strings.length-1; i++) {
                    let string = strings[i];
                    let beforePrefix = commonPrefix(strings[i-1], string); 
                    let afterPrefix = commonPrefix(string, strings[i+1]); 
                    let prefix = beforePrefix.length > afterPrefix.length ?
                                 beforePrefix :
                                 afterPrefix;
                    if (prefixToStrings.has(prefix)) {
                        prefixToStrings.get(prefix).push(string);
                    } else {
                        prefixToStrings.set(prefix, [string]);
                    }
                }
            }
            if (strings.length >= 2) {
                // Has one previous neighbour
                console.assert(i === strings.length-1,
                    "i should index the last element of the input strings");
                const prefix = commonPrefix(strings[i], strings[i-1]);
                prefixToStrings.set(prefix, strings[i]);
            }
            if (strings.length === 1) {
                prefixToStrings.set("", strings[0]);
            }
            return prefixToStrings;


            function commonPrefix(str1, str2) {
                if (str1 === "") {
                    return "";
                }

                let i = 0;
                while (str1[i] === str2[i]) {
                    i++;
                }
                return str1.slice(0, i);
            }
        }
    }


    //// Now, reverse, and repeat to get
    //let suffixCounts = new Map();

    //let affixGroups = new Map();
    //for (let s of strings) {
        //if prefixCounts[s] > suffixCounts[s] {
            //let prefix = s.slice(0, prefixCounts[s]);
            //let root = s.slice(prefixCounts[s]);
            //let ps = new PrefixString(prefix, root);
            //affixGroups.set(s, ps);
        //} else {
            //let suffix = s.slice(-suffixCounts[s]);
            //let root = s.slice(0, -suffixCounts[s]);
            //let ss = new SuffixString(root, suffix);
            //affixGroups.set(s, ss);
        //}
    //}
    return affixGroups;









    var affixGroups = new Map();
    for (var s of strings) {
        var p = s.slice(0, 3);
        var r = s.slice(3);
        affixGroups[s] = new PrefixString(p, r);
    }
    return affixGroups;
};

