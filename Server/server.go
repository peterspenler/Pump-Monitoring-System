package main

import (
	"bytes"
	"fmt"
	"github.com/olahol/melody"
	"strings"
	"strconv"
	"time"
	"errors"
)

// This is main function for the server program
func main() {
	//Connect to users Database
	dbusr := openUserDB()
	defer dbusr.Close()

	// Initialize melody session for websockers
	// and gin session for router
	heartbeat := -1
	m := melody.New()
	r := initRouter(m, dbusr, &heartbeat)

	// Initialize the heartbeat for checking connection to the
	// LabView program
	go heartbeatMonitor(&heartbeat, m)

	r.Run(":4000")
}

// This function takes an array of floats and converts it into a JSON array string
// Input: array of floats
// Return: JSON array string of the input floats
func buildArray(array []float64) string {
	var buffer bytes.Buffer

	buffer.WriteString("[")
	max := len(array) - 1
	for i := 0; i < max; i++ {
		buffer.WriteString(fmt.Sprintf("\"%f\",", array[i]))
	}
	buffer.WriteString(fmt.Sprintf("\"%f\"]", array[max]))

	return buffer.String()
}

// This function converts the string from the LabView program into an array of floats
// Input: LabView data string
// Return: array of floats if successful or nil if error, nil if successful or error on error
func formatData(msg string) (data []float64, err error){
	if len(msg) < 6{
		return nil, errors.New("Message too small")
	}
	if msg[:5] == "SRC$$" {
		strings := strings.Split(msg, "$$")
		floats := []float64{}

		for _, element := range strings[1:] {
			num, err := strconv.ParseFloat(element, 64)
			if err == nil{
				floats = append(floats, num)
			} else {
				fmt.Println(err)
				return nil, errors.New("Float parsing error")
			}
		}

		return floats, nil
	} else {
		return nil, errors.New("Invalid starting tag")
	}
}

// This is a looping function that constantly updates and checks the heatbeat of the LabView program.
// The heartbeat is initialized to -1 in main, and then set to 0 by the loop.
// Any time the server receives data from the LabView the heartbeat is set to 1.
// On each loop this function checks the value of the heartbeat. If it is 1, the function knows that the
// server received data and sets it back to 0. If it is still 0 then the server knows that no data has
// been received in the past 2 seconds, and it broadcasts a JSON error message to all clients and sets
// the heartbeat to the error value (2).
func heartbeatMonitor(heartbeat *int, m *melody.Melody) {
	for true {
		if *heartbeat == -1 {
			*heartbeat = 0;
		} else if *heartbeat == 1 {
			*heartbeat = 0
		} else if *heartbeat == 0 {
			m.Broadcast([]byte(`{"error": "src_disconnect"}`)) //TODO make this a filtered broadcast
			fmt.Println("LOST CONN")
			*heartbeat = 2
		}
		time.Sleep(2 * time.Second)
	}
}
