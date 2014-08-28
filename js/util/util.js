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

Util.arrayToObject = function(array, idFn) {
    var result = {};
    for(var i = 0; i < array.length; i++) {
        if(idFn) {
            result[idFn(array[i])] = array[i];
        }
        else {
            result[array[i]] = array[i];
        }
    }
};

Util.objectUnion = function() {
    var result = {};
    
    for(var i = 0; i < arguments.length; i++) {
        var obj = arguments[i];
        for(var key in obj) {
            result[key] = obj[key];
        }
    }

    return result;
};


Util.objectIntersection = function() {
    var result = Util.objectUnion.apply(this, arguments);
    
    for(var key in result) {
        for(var i = 0; i < arguments.length; i++) {
            if(arguments[i][key] == undefined) {
                delete result[key];
            }
        }
    }
    
    return result;
};

/**
 * Removes elements from an array
 * 
 * @param  {Array} arr The array
 * @param  {Function|any} arg A function that matches elements to be removed,
 *             or the element to be removed
 */
Util.removeFromArray = function(arr, arg) {
    if (arg.constructor == Function) {
        var f;
        while (f = arr.filter(arg)[0])
            arr.splice(arr.indexOf(f), 1);
    } else {
    	arr.splice(arr.indexOf(arg), 1);
    }
};

/**
 * Creates an SVG element with the proper namespace, and returns
 * a jQuery reference to the new element
 * 
 * @param  {String} tag The tag name for the element to create
 * @return {jQuery.selection} A jQuery selection instance of the element
 */
Util.svgElement = function(tag) {
    return $(document.createElementNS("http://www.w3.org/2000/svg", tag));
};