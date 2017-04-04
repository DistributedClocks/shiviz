#!/usr/bin/perl
use strict;

####################################
# To generate documentation, run:
#
# perl docgen OUTPUT_DIR
####################################

die "\nUsage: perl docgen.pl OUTPUT_DIRECTORY.\n\n" if @ARGV != 1;

my $dest = $ARGV[0] . "/docs";
my $deltempcmd = "rm -r ./jsdoc ./js/README.md > /dev/null 2>&1";

# Unzip JSDoc3. JSDoc3 is zipped to decrease its size and to keep it in one file
if (system("unzip -o jsdoc.zip > /dev/null 2>&1")) {
    system($deltempcmd);
    die "Unzip failed";
}

# copy doc-index.txt to appropriate location
system("cp doc-index.md ./js/README.md");

# compile using JSDoc3
if (system(" ./jsdoc/node_modules/.bin/jsdoc -r -d " . $dest . " ./js ./js/README.md")) {
     system($deltempcmd);
     die "Compilation failed";
}

# delete temporary files
system($deltempcmd);

print "Success\nDocumentation written to " . $dest . "\n";
