# ShiViz Log Generator

This log generator generates a sample log file by simulating processes to generate events.

## Usage

```
go run log_generator.go <config_file> <output_file_name>
```

## Config File

+ num_events : Total number of events that should be in the log file
+ num_procs : Maximum number of processes to use
+ ratio : The ratio of local log events to networking events
+ type : Describes the strategy used for generating events

### Generation Strategies

+ var_ratio : The ratio in the config file will be discarded and a ratio will be sampled in the range of [0.0,1.0] with precision upto the 1st decimal place (only values like 0.0,0.1,0.2,...0.9,1.0)
+ var_events : The num_events in the config file will be discarded and a new value will be sampled as ( rand.Intn([0,7)) + 6 ) * 1000)
+ var_procs : The num_procs in the config file will be discarded a  new value will be sampled between 1-24.
+ const : The values in the config file will be used as is, without varying the number of events, processes, or the ratio of local to networking events.

A sample config file is shown at config.json which was used to produce sample.log
