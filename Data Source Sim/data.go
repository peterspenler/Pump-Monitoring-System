package main

import (
	"github.com/gorilla/websocket"
	"log"
	"math/rand"
	"time"
	"fmt"
	"bytes"
	"net/url"
	"net/http"
	"flag"
)

// This is a tesing program
// It is designed to simulate how LabView sends data to the server
// so that the server can be developed without needing to run LabView

// Hold the address of the server
var addr = flag.String("addr", "localhost:4000", "http service address")

func main() {

	u := url.URL{Scheme: "ws", Host: *addr, Path: "/ws"}
	log.Printf("connecting to %s", u.String())
	
	header := make(http.Header)

	c, _, err := websocket.DefaultDialer.Dial(u.String(), header)
	
	if err != nil {
		log.Panic("dial:", err)
	}
	defer c.Close()

	mockSensorValues(c)
}

//Generates random sensor values for testing the server without LabView
func mockSensorValues(c *websocket.Conn) {
	temps := [6]float64{0, 0, 0, 0, 0, 0}
	press := [4]float64{0, 0, 0, 0}
	torq := [2]float64{0, 0}
	flow := [1]float64{0}

	ranGen := rand.New(rand.NewSource(time.Now().UnixNano()))
	data := []byte("NULL")

	err := c.WriteMessage(websocket.TextMessage, []byte("7w!z$C&F)J@NcRfUjXn2r5u8x/A?D*G-"))
	if err != nil {
		fmt.Println("Handshake Err:", err)
		return
	}

	for true {

		for i := 0; i < 6; i++ {
			temps[i] = float64(Abs(int(temps[i]) + ranGen.Intn(20) - 10))
		}
		for i := 0; i < 4; i++ {
			press[i] = float64(Abs(int(press[i]) + ranGen.Intn(20) - 10))
		}
		for i := 0; i < 2; i++ {
			torq[i] = float64(Abs(int(torq[i]) + ranGen.Intn(20) - 10))
		}
		flow[0] = float64(Abs(int(flow[0]) + ranGen.Intn(20) - 10))

		data = []byte(`SRC` + buildTable(temps[:], "Temperature", 6) + buildTable(press[:], "Pressure", 4) + buildTable(torq[:], "Torque", 2) + buildTable(flow[:], "Flow", 1))

		err := c.WriteMessage(websocket.TextMessage, data)

		if err != nil {
			fmt.Println("MSG Err:", err)
			return
		}

		time.Sleep(90 * time.Millisecond)
	}

}

// Returns the absolute value of the input
func Abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

// Builds the mock data into the format of the LabView string
func buildTable(array []float64, title string, num int) string {
	var buffer bytes.Buffer

	max := num - 1
	for i := 0; i <= max; i++ {
		buffer.WriteString(fmt.Sprintf("$$%f", array[i]))
	}

	return buffer.String()
}
