# Graph Representation of ShiViz logs

ShiViz works well with logs from all sources as long as there is a
regular expression that can be used to parse events from these logs.
However, once we have these logs in ShiViz log format, it can be hard to
get the data into a format that can be easily used by user-defined
applications and parsers. Thus, instead of having everyone write their
own parser for ShiViz logs, we provide this script for converting
a given ShiViz log to a graph representation saved as a json object.
This json object/file can then easily be loaded and interpreted using
json parser libraries in language of your choice.

## Format

The graph json object has 2 fields both of which are arrays of Json Objects :

+ hosts - Array of Host
+ links - Array of Link

### Host

Each host represents a node in the distributed system. It has 2 fields of its
own:

+ id : Name of the node. This is unique across all hosts.
+ description : A brief description describing the role of the node.

### Link

Link represents a connection between 2 nodes.
It has the following the fields:

+ source : Source of the event
+ target : target of the event
+ timestamp : The individual vector clock value at the target
+ clock : The full vector clock timestamp at the target for the event
+ description : The description of the event

#### Local Events

Each Local event in the log is represented as a 1 single Link in
the graph. For a local event, the source and target values of the link
are the same.

## Usage

The python script requires 2 command line arguments. The first argument
is the regular expression that is input to ShiViz for parsing the log 
and the 2nd argument is the path to the shiviz log file that needs to
be converted into graph format. The script currently assumes that the
regular expression contains at least the following 3 tags so that the
script has enough information to parse the log correctly:

+ ?\<clock\>
+ ?\<host\>
+ ?\<event\>

The script ignores all the other tags.

Here is an example:

```
    > python3 log_graph_converter.py "(?<host>\S*) (?<clock>{.*})\n(?<event>.*)" RpcClientServer.log
```