import jsonpickle
from pathlib import Path
import re
import sys

class Clock:
    def __init__(self, hosts, host_value_map):
        self.hosts = hosts
        self.host_value_map = host_value_map

    def __str__(self):
        return str(self.host_value_map)

class Event:
    def __init__(self, host, clock, description):
        self.host = host
        self.clock = clock
        self.description = description

    def __str__(self):
        return self.host + " " + self.clock + " " + self.description

class Node:
    def __init__(self, id, description):
        self.id = id
        self.description = description

class Link:
    def __init__(self, source, destination, source_timestamp, destination_timestamp, clock):
        self.source = source
        self.destination = destination
        self.source_timestamp = source_timestamp
        self.destination_timestamp = destination_timestamp
        self.clock = clock

def parse_clock(clock):
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

def get_links(events):
    #TODO
    return []

def get_graph_object(hosts, links):
    nodes = []
    for host in hosts:
        nodes += [Node(host, "")]
    graph = {}
    graph['nodes'] = nodes
    graph['links'] = links
    return graph

def write_graph(json_file, hosts, links):
    graph = get_graph_object(hosts, links)
    with open(json_file, 'w+') as outf:
        obj = jsonpickle.encode(graph, unpicklable=False)
        outf.write(obj)

def convert_log(regex, log_filename, graph_filename):
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
    links = get_links(events)
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
