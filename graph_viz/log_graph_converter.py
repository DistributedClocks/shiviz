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

def parse_clock(clock):
    #TODO
    print(re.split(",|\{|\}", clock))
    return clock

def get_links(events):
    #TODO
    return

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
    print(hosts)
    # links = get_links(events)

def main():
    if len(sys.argv) != 3:
        print("Usage: python log_graph_converter.py <RegExp> <ShiViz_log_file>")
        sys.exit(1)
    re = sys.argv[1]
    log_file = sys.argv[2]
    convert_log(re, log_file, "")

if __name__ == '__main__':
    main()
