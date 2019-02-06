package main

import (
	"bytes"
	"fmt"
	"github.com/olahol/melody"
	"strings"
	"strconv"
	"time"
)

func main() {
	//Connect to users Database
	dbusr := openUserDB()
	defer dbusr.Close()

	m := melody.New()
	r := initRouter(m, dbusr)

	heartbeat := -1
	go heartbeatMonitor(&heartbeat, m)

	r.Run(":5000")
}

//Builds the HTML table for sensor data
func buildTable(array []float64, title string, num int) string {
	var buffer bytes.Buffer

	buffer.WriteString("[")
	max := num - 1
	for i := 0; i < max; i++ {
		buffer.WriteString(fmt.Sprintf("\"%f\",", array[i]))
	}
	buffer.WriteString(fmt.Sprintf("\"%f\"]", array[max]))

	return buffer.String()
}

func formatData(msg string) (data []float64, valid bool){
	if msg[:5] == "SRC//" {
		strings := strings.Split(msg, "//")
		floats := []float64{}

		for _, element := range strings[1:] {
			num, err := strconv.ParseFloat(element, 64)
			if err == nil{
				floats = append(floats, num)
			} else {
				fmt.Println(err)
				return nil, false
			}
		}

		return floats, true
	} else {
		return nil, false
	}
}

func heartbeatMonitor(heartbeat *int, m *melody.Melody) {
	for true {
		if *heartbeat == -1 {
			*heartbeat = 0;
		} else if *heartbeat == 1 {
			*heartbeat = 0
			time.Sleep(2 * time.Second)
		}
	}
}
