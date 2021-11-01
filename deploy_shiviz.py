#!/usr/bin/python

'''
Purpose:
=========

This script packages and deploys the shiviz project to:
https://bestchai.bitbucket.io/shiviz/


Usage:
=======

- This script must be run from within the top level shiviz source directory.

- This script must be run from OSX :)

- This script:
  1. Generates the documentation for shiviz using jsdoc3

  2. Removes the proxy hack that allows shiviz to access log files
     when shiviz is run locally.

  3. Adds google analytics tracking.

  4. Copies over the entire d3/ source tree over to a destination that
     is assumed to be the https://bitbucket.org/bestchai/shiviz/src/default/ repo.
  
  5. Commits and pushes the https://bitbucket.org/bestchai/bestchai.bitbucket.org/src/default/ repo.
'''


import sys
import os
import fileinput
import subprocess
import argparse
import time

def get_cmd_output(cmd, args):
    '''
    Returns the standard output from running:
    $ cmd args[0] args[1] .. args[n]

    Where cmd is the command name (e.g., 'svn') and args is a list of
    arguments to the command (e.g., ['help', 'log']).
    '''
    return subprocess.Popen([cmd] + args,
                            stdout=subprocess.PIPE, 
                            stderr=subprocess.STDOUT).communicate()[0]


def runcmd(s):
    '''
    Logs and runs a shell command.
    '''
    print "os.system: " + s
    return os.system(s)


def minify(revid):
    '''
    Minifies all of the js code under js/ using Google Closure Compiler  and
    writes the minified resulting js code to js/min.js.
    '''

    exit_code = runcmd("google-closure-compiler js/**.js !dev.js local_scripts/**.js --js_output_file js/min.js")
    
    # Wait some time to make sure that minification is completed and min.js is created.
    time.sleep(15)
    
    if exit_code != 0:
        print("Minification failed!")
        sys.exit(-1)

    minified_file = fileinput.input("js/min.js", inplace=True)
    # Add hg revision id to the minified code.
    for line in minified_file:
        sys.stdout.write(line.replace("revision: ZZZ", "revision: %s" % revid))

    
def parse_args():
    '''
    Method to process the command line arguments. Expects only one of the two following options:
    -d or --dev to deploy to bestchai.bitbucket.org/shiviz-dev/
    -p or --prod to deploy to bestchai.bitbucket.org/shiviz/

    If no flag specified or the specified flag is invalid, outputs the help dialogue.  
    '''

    parser = argparse.ArgumentParser()
    argument_group = parser.add_mutually_exclusive_group(required=True)

    argument_group.add_argument("-d", "--dev", help="Deploys ShiViz to development environment.", action="store_true")
    argument_group.add_argument("-p", "--prod", help="Deploys ShiViz to production environment.", action="store_true")

    return parser.parse_args()


def main(args):
    '''
    Workhorse method to execute all the of the steps described in the file header.
    '''
    
    src_dir = "./"

    if args.prod:
        dist_dir = "../bestchai.bitbucket.org/shiviz/"
    elif args.dev:
        dist_dir = "../bestchai.bitbucket.org/shiviz-dev/" 
     

    print "Deploying to: " + dist_dir
    print "from: " + src_dir

    # TODO: add a confirmation yes/no dialog, before going ahead with rm.

    # Remove previously deployed version of shiviz.
    if (os.path.exists(dist_dir)):
        runcmd("rm -rf " + dist_dir + "*")
    else:
        print "Error: deployment dir is not where it is expected."
        sys.exit(-1)

    do_minification = raw_input("Do you want to minify the code? (Y/N) ") == "Y"
    if do_minification:
        # Check if google-closure-compiler is installed.
        if (runcmd("google-closure-compiler --version") != 0):
            print("You need to install google-closure-compiler for minification.")
            print("The easiest way to install the compiler is with NPM or Yarn.")

            continue_without_modification = raw_input("Do you want to continue without modification? (Y/N)") == "Y"
            if not continue_without_modification:
                sys.exit(-1)
            do_minification = False

    # Copy over the source.
    if (os.path.exists(src_dir)):
        runcmd("cp -R " + src_dir + "* " + dist_dir)
        if do_minification:
            # Remove js source code since we will be using a minified version (see below).
            runcmd("rm -rf " + dist_dir + "/js/*")
    else:
        print "Error: source dir is not where it is expected."
        sys.exit(-1)

    # Compile docs
    if (runcmd("perl docgen.pl " + dist_dir) != 0):
        sys.exit(-1)

    # Find out the current revision id:
    # hg:
    # revid = get_cmd_output('hg', ['id', '-i']);
    # git:
    revid = get_cmd_output('git', ['rev-parse', '--short', 'HEAD']);
    revid = revid.rstrip()

    # Find out the current branch:
    # hg:
    # branch = get_cmd_output('hg', ['branch']);
    # git:
    branch = get_cmd_output('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    branch = branch.rstrip();

    print "Revid is : " + revid
    print "Branch is : " + branch

    # Remove any files containing '#'
    runcmd("cd " + dist_dir + " && find . | grep '#' | xargs rm")

    # Remove any files containing '~'
    runcmd("cd " + dist_dir + " && find . | grep '~' | xargs rm")

    # Remove any files containing '~'
    runcmd("cd " + dist_dir + " && find . | grep '.orig' | xargs rm")

    if do_minification:
        # Minify the code
        print "Minifying... please wait"
        minify(revid)

        minified_size = os.path.getsize('js/min.js')
        print "Minified size: %i" % minified_size
        
        if minified_size < 500:
            print "Minification failed!"
            return
        
        print "Minification successful!"

        # Replace reference to js files with minified js in deployed version
        # of index.html.
        runcmd("sed -i '' -e 's/<script[^>]*><\/script>//g' " + dist_dir + "index.html")
        runcmd("sed -i '' -e 's/<\/body>/<script src=\"js\/min.js\"><\/script><\/body>/g' " + dist_dir + "index.html")
    else:
        # Replace dev.js import in index.html with deployed.js import
        runcmd("sed -i '' -e 's/\"js\/dev.js\"/\"js\/deployed.js\"/g' " + dist_dir + "index.html")
        
        # Change the contents of deployed.js to include correct hg revision id
        runcmd("sed -i '' -e 's/revision: ZZZ/revision: " + revid + "/g' " + dist_dir + "/js/deployed.js")
        
    # Add any files that are new and remove any files that no longer exist
    # hg:
    # runcmd("cd " + dist_dir + " && hg addremove")
    # git:
    runcmd("cd " + dist_dir + " && git add -A")

    # Commit the deployed dir.
    runcmd("cd " + dist_dir + " && git commit -m 'shiviz auto-deployment'")
    
    # Push the deployed dir.
    runcmd("cd " + dist_dir + " && git push")
    
    print
    print "Done."
    return


if __name__ == "__main__":
    args = parse_args()
    main(args)
