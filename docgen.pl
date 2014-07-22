#!/usr/bin/perl
use strict;

# To generate documentation, run:
# perl docgen [OUTPUT_DIR]
# Default output dir = ~/Desktop/shiviz-docs

die "\nUsage: perl docgen.pl [OUTPUT_DIRECTORY].\nDefault output dir: ~/Desktop/shiviz-docs\n\n" if @ARGV > 1;

my $dest = @ARGV == 1 ? $ARGV[0] : "~/Desktop/shiviz-docs";
my $deltempcmd = "rm -r ./jsdoc-master > /dev/null 2>&1";

if(system("unzip -o jsdoc-master.zip > /dev/null 2>&1")) {
	system($deltempcmd);
	die "Unzip failed";
}

system("rm -r " . $dest . " > /dev/null 2>&1");

if(system("./jsdoc-master/jsdoc -d " . $dest . " ./js")) {
	system($deltempcmd);
	die "Compilation failed";
}

system($deltempcmd);

print "Success\nDocumentation written to " . $dest . "\n";
