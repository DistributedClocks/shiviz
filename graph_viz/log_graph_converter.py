# Works only with Python3
# Requires jsonpickle to be installed
import jsonpickle
from pathlib import Path
import re
import sys

class Clock:
    """Object that represents a single vector clock timestamp

    Attributes:
        hosts (set[str]) : Set of all nodes in the timestamp
        host_value_map (map[str]int) : Map of hosts to their individual timestamp valuess
    """
    def __init__(self, hosts, host_value_map):
        self.hosts = hosts
        self.host_value_map = host_value_map

    def __str__(self):
        return str(self.host_value_map)

class Event:
    """Object that represents an event in the log
    
    Attributes:
        host (str) : Name of the node at which the event was recorded
        clock (map[str]int) : Vector clock timestamp when the event was recorded
        description (str) : Description of the event.
    """
    def __init__(self, host, clock, description):
        self.host = host
        self.clock = clock
        self.description = description

    def __str__(self):
        return self.host + " " + self.clock + " " + self.description

class Node:
    """Object that represents a Node in a ShiViz log

    Attributes:
        id (str) : Unique name of the specific node
        description (str) : A brief description of the role of the node
    """
    def __init__(self, id, description):
        self.id = id
        self.description = description

class Link:
    """Object which represents an edge in the graph version of the ShiViz log

    Note:
        For a link, an event can be either single-node (i.e. local to a node) or double-node (i.e. comprised of 2 events - 1 send, 1 receive)

    Attributes:
        source (str) : Name of the node at which the event started
        target (str) : Name of the node at which the event ended
        timestamp (str) : Timestamp of the node at which the event ended.
        clock (map[str]int) : Vector clock timestamp when the event ended
        description (str) : Description at the end of the event
    """
    def __init__(self, source, target, timestamp, clock, description):
        self.source = source
        self.target = target
        self.timestamp = timestamp
        self.clock = clock
        self.description =description

def parse_clock(clock):
    """Parses a vector clock timestamp into a Clock object

    Args:
        clock (str) : A vector clock timestamp

    Returns:
        new_clock (Clock) : A Clock object which contains a set of hosts 
                            and a map of host to their respective timestamp
    """
    hosts = set()
    host_value_map = {}
    clock_vals = re.split(",|\{|\}", clock)
    for host_val_pair in clock_vals:
        if host_val_pair != '':
            val_array = host_val_pair.split(':')
            host = val_array[0].strip(' ').strip('"')
            val = int(val_array[1])
            hosts.add(host)
            host_value_map[host] = val
    new_clock = Clock(hosts, host_value_map)
    return new_clock

def get_self_links(host, events):
    """Constructs local events for a host into a list of 'self links' 
    Note : 
        A self-link is a link where the source and target of the graph is the same.
        It is just a convenient way of representing local events in the graph format which is consistent with inter-node links.

    Args:
        host (str) : Name of the host at which the local events took place
        events (Event[]) : List of all events that took place at 'host'

    Returns:
        links (Link[]) : List of all self-links for the specified host
    """
    links = []
    for e in events:
        link = Link(host, host, e.clock.host_value_map[host], e.clock.host_value_map, e.description)
        links += [link]
    return links

def get_links(hosts, events):
    links = []
    for host in hosts:
        host_specific_events = []
        for e in events:
            if e.host == host:
                host_specific_events += [e]
        self_links = get_self_links(host, host_specific_events)
        links = links + self_links

    for e1 in events:
        for e2 in events:
            if e1.host != e2.host:
                clock1 = e1.clock.host_value_map
                clock2 = e2.clock.host_value_map
                if e1.host in clock2:
                    if clock1[e1.host] == clock2[e1.host]:
                        #e1 is the source
                        source = e1.host
                        target = e2.host
                        num_diffs = 0
                        for host, val in clock1.items():
                            if host in clock2:
                                if clock2[host] != val:
                                    num_diffs += 1
                        if num_diffs <= 1:
                            link = Link(source, e2.host, clock2[e2.host], clock2, e2.description)
                            links += [link]
    return links

def get_graph_object(hosts, links):
    """Constructs a graph object that can be represented as a json object

    Args:
        hosts (Node[]) : Array of Nodes that were part of the log
        links (Link[]) : Array of Links in the log

    Return:
        graph (map[str]Object) : A map which has 2 keys, 'nodes' and 'links',
                                 and their respective values
    """
    nodes = []
    for host in hosts:
        nodes += [Node(host, "")]
    graph = {}
    graph['nodes'] = nodes
    graph['links'] = links
    return graph

def write_graph(json_file, hosts, links):
    """Writes the graph representation of the execution to a file

    Args:
        json_file (str) : Name of the file to which the graph should be written
        hosts (Node[]): Array of Nodes that were part of the log
        links (Link[]): Array of Links in the log

    """
    graph = get_graph_object(hosts, links)
    with open(json_file, 'w+') as outf:
        jsonpickle.set_encoder_options('json', indent=4)
        obj = jsonpickle.encode(graph, unpicklable=False)
        outf.write(obj)

def convert_log(regex, log_filename, graph_filename):
    """Converts an existing shiviz log into a graph representation and writes it to a file

    Args:
        regex (str) : Regular Expression which denotes the event in the original ShiViz log
        log_filename (str) : Name of the ShiViz log file
        graph_filename (str) : Name of the file to which the graph should be written

    """
    tag_pattern = re.compile(r"\?\<(\w+)\>")
    tags = tag_pattern.findall(regex)
    host_index = tags.index('host')
    clock_index = tags.index('clock')
    event_index = tags.index('event')
    hosts = set()
    events = []
    transformed_regex = tag_pattern.sub("", regex)
    with open(log_filename, 'r') as inf:
        content = inf.read()
        matches = re.findall(transformed_regex, content)
        for match in matches:
            hosts.add(match[host_index])
            clock = parse_clock(match[clock_index])
            event = Event(match[host_index], clock, match[event_index])
            events += [event]
    links = get_links(hosts, events)
    write_graph(graph_filename, hosts, links)

def main():
    if len(sys.argv) != 3:
        print("Usage: python log_graph_converter.py <RegExp> <ShiViz_log_file>")
        sys.exit(1)
    re = sys.argv[1]
    log_file = sys.argv[2]
    filename = Path(log_file)
    json_file = filename.with_suffix('.json').name
    convert_log(re, log_file, json_file)

if __name__ == '__main__':
    main()
