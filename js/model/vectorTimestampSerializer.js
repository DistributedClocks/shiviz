/**
 * Constructs a new {@link VectorTimestamp} serializer with the specified
 * format, separator, header and footer
 * 
 * @classdesc
 * 
 * <p>
 * This class can be used to serialize a list of {@link VectorTimestamp}s into
 * a string. The serialization can be customized using the format, separator,
 * header, and footer params. The purpose of each of those is described below.
 * </p>
 * 
 * <p>
 * For example, if format="`HOST`:`CLOCK`", separator="," , header="[",
 * footer="]", and the vector timestamps to serialize were "a {'a':1}" and "b
 * {'b':1, 'a':1}", the resulting serialization would be
 * "[a:{'a':1},b:{'b':1,'a':1}]"
 * </p>
 * 
 * @constructor
 * @param {String} format The format string describes how to serialize each
 *            vector timestamp. It can be any arbitrary string. For each vector
 *            timestamp, the substring in the format string equal to
 *            {@link VectorTimestampSerializer.HOST_PLACEHOLDER} will be
 *            replaced with the timestamp's host, and
 *            {@link VectorTimestampSerializer.CLOCK_PLACEHOLDER} will be
 *            replaced with the timestamp's clock.
 * @param {String} separator The separator string is placed in between each
 *            serialized vector timestamp.
 * @param {String} header The header string is prepended to the beginning of the
 *            rest of the serialization
 * @param {String} footer the footer string is appended to the end of the rest
 *            of the serialization
 */
function VectorTimestampSerializer(format, separator, header, footer) {

    /** @private */
    this.format = format;

    /** @private */
    this.separator = separator;

    /** @private */
    this.header = header;

    /** @private */
    this.footer = footer;
}

/**
 * @static
 * @const
 */
VectorTimestampSerializer.HOST_PLACEHOLDER = "`HOST`";

/**
 * @static
 * @const
 */
VectorTimestampSerializer.CLOCK_PLACEHOLDER = "`CLOCK`";

/**
 * Serializes an array of vector timestamps. The timestamps will be serialized
 * in the order they are found in the array.
 * 
 * @param {Array<VectorTimestamp>} The vector timestamps to serialize.
 * @returns {String} The resulting serialization
 */
VectorTimestampSerializer.prototype.serialize = function(vectorTimestamps) {
    var context = this;

    return this.header + vectorTimestamps.map(function(vt) {
        return context.format.replace(VectorTimestampSerializer.HOST_PLACEHOLDER, vt.getOwnHost()) //
        .replace(VectorTimestampSerializer.CLOCK_PLACEHOLDER, JSON.stringify(vt.getClock()));
    }).join(this.separator) + this.footer;
};
