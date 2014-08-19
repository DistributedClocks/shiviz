/**
 * Util is not an instantiable class. Do not call this constructor
 * 
 * @classdesc
 * 
 * Util is a utility class containing methods commonly used throughout Shiviz.
 * Util is not instantiable and only contains public static methods. No method
 * in Util is allowed to modify any sort of global state.
 * 
 * @constructor
 */
function Util() {
    throw new Exception("Util is not instantiable");
}

/**
 * Creates a shallow copy of a raw object
 * 
 * @static
 * @param {Object} obj the object to clone
 * @returns {Object} the clone
 */
Util.objectShallowCopy = function(obj) {
    var result = {};
    for (var key in obj) {
        result[key] = obj[key];
    }
    return result;
};


Util.svgElement = function(tag) {
    return $(document.createElementNS("http://www.w3.org/2000/svg", tag));
};