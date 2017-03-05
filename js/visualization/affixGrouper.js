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
 * Detemines groups strings based on either common prefix or common suffix, whichever
 * is longer, and returns a mapping of each original string to an AffixGroup
 * (either a PrefixGroup or a SuffixGroup).
 *
 * @param {strings} [String]
 * @returns [AffixGroup]
 */
AffixGrouper.groupLongestAffixes = function(strings) {
    var affixGroups = new Map();
    for (var s of strings) {
        var p = s.slice(0, 3);
        var r = s.slice(3);
        affixGroups[s] = new PrefixString(p, r);
    }
    return affixGroups;
};

