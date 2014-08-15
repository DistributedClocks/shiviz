function VectorTimestampSerializer(format, separator, header, footer) {

    this.format = format;
    
    this.separator = separator;

    this.header = header;

    this.footer = footer;
}

VectorTimestampSerializer.HOST_PLACEHOLDER = "`HOST`";
VectorTimestampSerializer.CLOCK_PLACEHOLDER = "`CLOCK`";

VectorTimestampSerializer.prototype.serialize = function(vectorTimestamps) {
    var context = this;
    
    return this.header + vectorTimestamps.map(function(vt) {
        return context.format.replace(VectorTimestampSerializer.HOST_PLACEHOLDER, vt.getOwnHost()) //
        .replace(VectorTimestampSerializer.CLOCK_PLACEHOLDER, JSON.stringify(vt.getClock()));
    }).join(this.separator) + this.footer;
};
