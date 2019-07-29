package main

import (
	"os"
	"io/ioutil"
	"encoding/json"
	"github.com/DistributedClocks/GoVector/govec/vclock"
	"log"
	"math/rand"
	"fmt"
	"time"
)

var (
	r1 *rand.Rand
)

type Config struct {
	Log_type string `json:"type"`
	Event_ratio float64 `json:"ratio"`
	Num_events int `json:"num_events"`
	Num_processes int `json:"num_procs"`
}

type Event struct {
	Hostname string
	Clock string
	Message string
	ProcId int
}

func (e *Event) String() string {
	var returnString string
	returnString = e.Hostname + " "
	returnString += e.Clock + "\n"
	returnString += e.Message + "\n"
	return returnString
}

func NewEvent(procID int, clock string, message string) Event {
	event := Event{}
	event.Hostname = get_proc_name(procID)
	event.Clock = clock
	event.Message = message
	event.ProcId = procID
	return event
}

func initialize_proc_clocks(num_procs int) map[int]vclock.VClock {
	proc_clock_map := make(map[int]vclock.VClock)
	for i := 0; i < num_procs; i++ {
		proc_clock_map[i] = vclock.New()
	}
	return proc_clock_map
}

func get_proc_name(procId int) string {
	return fmt.Sprintf("Proc%d", procId)
}

func generate_random_net_event(max_events_per_proc int, event_count map[int]int) (src int, dst int) {
	num_procs := len(event_count)
	generated := false
	for {
		if generated {
			break
		}
		src = r1.Intn(num_procs)
		if event_count[src] <= max_events_per_proc {
			for {
				dst = r1.Intn(num_procs)
				if dst != src && event_count[dst] <= max_events_per_proc {
					generated = true
					break
				}
			}
		}
	}
	return src, dst
}

func generate_random_log_event(max_events_per_proc int, event_count map[int]int) int {
	var chosen_proc int
	num_procs := len(event_count)
	generated := false
	for {
		if generated {
			break
		}
		chosen_proc = r1.Intn(num_procs)
		if event_count[chosen_proc] <= max_events_per_proc {
			generated = true
		}
	}
	return chosen_proc
}

func generate_events(num_procs int, num_events int, ratio float64,clocks map[int]vclock.VClock) []Event {
	var events []Event
	current_events := 0
	approx_log_events := int((1.0 - ratio) * float64(num_events))
	approx_net_events := num_events - approx_log_events
	current_log_events := 0
	current_net_events := 0
	max_events_per_process := num_events / num_procs
	event_count := make(map[int]int)
	for i := 0; i < num_procs; i++ {
		event_count[i] = 0
	}
	for {
		if current_events >= num_events {
			break
		}

		// Add initialize events for the procs
		if current_events == 0 {
			for procId, clock := range clocks {
				procName := get_proc_name(procId)
				clock.Tick(procName)
				clocks[procId] = clock
				event := NewEvent(procId, clock.ReturnVCString(), "Initialization complete")
				events = append(events, event)
				current_events += 1
			}
		} else if current_log_events != approx_log_events && current_net_events != approx_net_events {
			choice := r1.Intn(2)
			if choice == 0 {
				src, dst := generate_random_net_event(max_events_per_process, event_count)
				event_count[src] += 1
				event_count[dst] += 1
				src_clock := clocks[src]
				dst_clock := clocks[dst]
				src_name := get_proc_name(src)
				dst_name := get_proc_name(dst)
				src_clock.Tick(src_name)
				dst_clock.Tick(dst_name)
				dst_clock.Merge(src_clock)
				src_event := NewEvent(src, src_clock.ReturnVCString(), "Sending message to " + src_name)
				dst_event := NewEvent(dst, dst_clock.ReturnVCString(), "Received message from " + dst_name)
				events = append(events, src_event)
				events = append(events, dst_event)
				current_net_events += 2
				current_events += 2
			} else {
				proc_id := generate_random_log_event(max_events_per_process, event_count)
				if clock, ok := clocks[proc_id]; ok {
					clock.Tick(get_proc_name(proc_id))
					event := NewEvent(proc_id, clock.ReturnVCString(), "Local log message")
					events = append(events, event)
					current_log_events += 1
					current_events += 1
					event_count[proc_id] += 1
					clocks[proc_id] = clock
				}
			}
		} else if current_log_events == approx_log_events && current_net_events != approx_net_events {
			src, dst := generate_random_net_event(max_events_per_process, event_count)
			event_count[src] += 1
			event_count[dst] += 1
			src_clock := clocks[src]
			dst_clock := clocks[dst]
			src_name := get_proc_name(src)
			dst_name := get_proc_name(dst)
			src_clock.Tick(src_name)
			dst_clock.Tick(dst_name)
			dst_clock.Merge(src_clock)
			src_event := NewEvent(src, src_clock.ReturnVCString(), "Sending message to " + src_name)
			dst_event := NewEvent(dst, dst_clock.ReturnVCString(), "Received message from " + dst_name)
			events = append(events, src_event)
			events = append(events, dst_event)
			current_net_events += 2
			current_events += 2
		} else if current_log_events != approx_log_events && current_net_events == approx_net_events {
			proc_id := generate_random_log_event(max_events_per_process, event_count)
			if clock, ok := clocks[proc_id]; ok {
				clock.Tick(get_proc_name(proc_id))
				event := NewEvent(proc_id, clock.ReturnVCString(), "Local log message")
				events = append(events, event)
				current_log_events += 1
				current_events += 1
				event_count[proc_id] += 1
				clocks[proc_id] = clock
			}
		} else {
			fmt.Println("Something went wrong. Vaas' math sucks")
		}
	}

	return events
}

func generate_variable_ratio_log(config Config) []Event {
	num_procs := config.Num_processes
	proc_clock_map := initialize_proc_clocks(num_procs)
	num_events := config.Num_events
	ratio := float64(r1.Intn(10) + 1) / 10.0
	return generate_events(num_procs, num_events, ratio, proc_clock_map)
}

func generate_variable_procs_log(config Config) []Event {
	num_procs := r1.Intn(24) + 1
	proc_clock_map := initialize_proc_clocks(num_procs)
	num_events := config.Num_events
	ratio := config.Event_ratio
	return generate_events(num_procs, num_events, ratio, proc_clock_map)
}

func generate_variable_events_log(config Config) []Event {
	num_procs := config.Num_processes
	proc_clock_map:= initialize_proc_clocks(num_procs)
	num_events := (r1.Intn(7) + 6) * 1000
	ratio := config.Event_ratio
	return generate_events(num_procs, num_events, ratio, proc_clock_map)
}

func write_log_file(events []Event, log_filename string) {
	log_file, err := os.Create(log_filename)
	if err != nil {
		log.Fatal(err)
	}
	defer log_file.Close()

	log.Println("Writing log file")
	_, err = log_file.WriteString("(?<host>\\S*) (?<clock>{.*})\\n(?<event>.*)" + "\n\n")
	if err != nil {
		log.Fatal(err)
	}
	for i, event := range events {
		_, err := log_file.WriteString(event.String())
		if err != nil {
			log.Fatal(err)
		}

		if i % 1000 == 0 {
			log.Println("Wrote ", i, " events")
		}
	}
	log.Println("Finished writing log file")
}

func generate_log_file(config Config, log_file string) {
	var events []Event
	if config.Log_type == "var_ratio" {
		events = generate_variable_ratio_log(config)
	} else if config.Log_type == "var_procs" {
		events = generate_variable_procs_log(config)
	} else if config.Log_type == "var_events" {
		events = generate_variable_events_log(config)
	} else {
		log.Fatal("Invalid log type specified in the config file")
	}

	write_log_file(events, log_file)
}

func main() {
	if len(os.Args) != 3 {
		log.Fatal("Usage: go run log_generator.go <config.json> <outfile>")
	}

	s1 := rand.NewSource(time.Now().UnixNano())
    r1 = rand.New(s1)

	config_filename := os.Args[1]
	log_filename := os.Args[2]
	config_file, err := os.Open(config_filename)
	if err != nil {
		log.Fatal(err)
	}
	defer config_file.Close()
	bytes, err := ioutil.ReadAll(config_file)
	if err != nil {
		log.Fatal(err)
	}

	var config Config
	json.Unmarshal(bytes, &config)

	generate_log_file(config, log_filename)
}