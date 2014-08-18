#!/usr/bin/python

'''
Purpose:
=========

This script packages and deploys the shiviz project to:
http://bestchai.bitbucket.org/shiviz/


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
     is assumed to be the http://bestchai.bitbucket.org/shiviz/ repo.
  
  5. Commits and pushes the http://bestchai.bitbucket.org/shiviz/ repo.
'''


import sys
import os
import httplib
import urllib
import subprocess


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


def minify(branch, info):
    '''
    Minifies all of the js code under js/ using Google's API and
    returns the minified resulting js code.
    '''
    params = [
    ('code_url', 'http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.js'),
    ('code_url', 'http://d3js.org/d3.v3.min.js'),
    ('compilation_level', 'SIMPLE_OPTIMIZATIONS'),
    ('output_format', 'text'),
    ('output_info', info)
    ]

    url = 'https://bitbucket.org/bestchai/shiviz/raw/' + branch + '/'
    # Traverse all of the files underneath the js/ dir
    for root, dirs, files in os.walk('js'):
        for file in files:
            if not ('dev.js' in file):
                params += [('code_url', url + os.path.join(root, file))]

    urlparams = urllib.urlencode(params)
    headers = {'Content-type': 'application/x-www-form-urlencoded'}
    conn = httplib.HTTPConnection('closure-compiler.appspot.com')
    conn.request('POST', '/compile', urlparams, headers)
    response = conn.getresponse()
    data = response.read() 
    conn.close()

    return data
    

def main():
    '''
    Workhorse method to execute all the of the steps described in the file header.
    '''
    
    src_dir = "./"
    dist_dir = "../bestchai.bitbucket.org/shiviz/"

    print "Deploying to: " + dist_dir
    print "from: " + src_dir

    # TODO: add a confirmation yes/no dialog, before going ahead with rm.

    # Remove previously deployed version of shiviz.
    if (os.path.exists(dist_dir)):
        runcmd("rm -rf " + dist_dir + "*")
    else:
        print "Error: deployment dir is not where it is expected."
        sys.exit(-1)

    # Copy over the source.
    if (os.path.exists(src_dir)):
        runcmd("cp -R " + src_dir + "* " + dist_dir)
        # Remove js source code since we will be using a minified version (see below).
        runcmd("rm -rf " + dist_dir + "/js/*")
    else:
        print "Error: source dir is not where it is expected."
        sys.exit(-1)

    # Compile docs
    if (runcmd("perl docgen.pl " + dist_dir) != 0):
        sys.exit(-1)

    # Find out the current revision id:
    revid = get_cmd_output('hg', ['id', '-i']);
    revid = revid.rstrip()

    # Find out the current branch:
    branch = get_cmd_output('hg', ['branch']);
    branch = branch.rstrip();

    print "Revid is : " + revid
    print "Branch is : " + branch

    # Remove any files containing '#'
    runcmd("cd " + dist_dir + " && find . | grep '#' | xargs rm")

    # Remove any files containing '~'
    runcmd("cd " + dist_dir + " && find . | grep '~' | xargs rm")

    # Remove any files containing '~'
    runcmd("cd " + dist_dir + " && find . | grep '.orig' | xargs rm")

    # Minify the code
    print "Minifying... please wait"
    data = minify(branch, 'compiled_code')
    print "Minified size: %i" % len(data)

    if len(data) < 500:
        print "Minification failed!"
        print minify(branch, 'errors')
        return

    print "Minification successful!"
    # Add hg revision id to the minified code.
    data = data.replace("revision: ZZZ", "revision: %s" % revid)

    # Save the minified code into js/min.js
    minified = open(dist_dir + 'js/min.js', 'w')
    minified.write(data)
    minified.close()

    # Replace reference to js files with minified js in deployed version
    # of index.html.
    runcmd("sed -i '' -e 's/<script[^>]*><\/script>//g' " + dist_dir + "index.html")
    runcmd("sed -i '' -e 's/<\/body>/<script src=\"js\/min.js\"><\/script><\/body>/g' " + dist_dir + "index.html")
    
    # Add any files that are new and remove any files that no longer exist
    runcmd("cd " + dist_dir + " && hg addremove")

    # Commit the deployed dir.
    runcmd("cd " + dist_dir + " && hg commit -m 'shiviz auto-deployment'")
    
    # Push the deployed dir.
    runcmd("cd " + dist_dir + " && hg push")

    print
    print "Done."
    return


if __name__ == "__main__":
    main()
