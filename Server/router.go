package main

import (
	"bytes"
	"database/sql"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"time"
	"io/ioutil"
)

// This function initializes the router for handling HTTP requests
// Input: melody Websockets session, users database, heartbeat int pointer
// Return: gin router 
func initRouter(m *melody.Melody, usrDB *sql.DB, heartbeat *int) *gin.Engine {

	// This initializes a default gin session
	//gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// This defines a '/api' URL subgroup
	// At this point that only includes login functionality
	api := r.Group("/api")
	{
		// This prevents clients from making GET requests to the login API
		api.GET("/login", func(c *gin.Context) {
			c.Writer.WriteHeader(http.StatusMethodNotAllowed)
		})

		// This setting handles authentication on POST requests to the login API
		//
		// If the client POSTs a valid username and password, then a JWT is generated
		// and returned to the client. Otherwise a 401 code with a message is returned
		api.POST("/login", func(c *gin.Context) {
			uname := c.PostForm("uname")
			password := c.PostForm("password")
			dbuname, dbname, dbpword, dbid, queryerr := getUserData(uname, usrDB)

			if queryerr != nil {
				fmt.Println("QUERY ERROR:", queryerr)
			}

			correctpass := verifyPassword(dbpword, password)

			if correctpass == nil {
				tokenStr, exptime := createLoginToken(dbuname, dbname, dbid)

				c.JSON(http.StatusOK, gin.H{
					"jwt":     tokenStr,
					"exptime": exptime,
				})
			} else {
				c.String(http.StatusUnauthorized, "Authentication Failure")
			}
		})
	}


	// This setting handles data transfer from the LabView program via an HTTP POST rather
	// than via Websockets. While using Websockets may be preferable to reduce server load
	// it is difficult to get them to work in LabView, and this is a reasonable solution.
	//
	// This setting could be replaced with LabView using Websockets to send the data 
	r.POST("/data/submit", func(c *gin.Context){
		key := c.PostForm("key")
		data := c.PostForm("data")

		if key == string(getKey()){
			handleLVData(data, m, heartbeat)
			c.String(http.StatusOK, "Cool Stuff, Thanks")
		}
	})

	// This setting prints a message to the console if a GET request is made to the
	// base of the domain
	r.GET("/", func(c *gin.Context) {
		fmt.Println("ROOT REQUEST")
	})

	// Serves a page for adding a new user
	r.GET("/genusr", func(c *gin.Context) {
		http.ServeFile(c.Writer, c.Request, "genusr.html")
	})

	// Prints the username and hash of the password entered on the /genusr page
	// to the console
	r.POST("/genusr", func(c *gin.Context) {
		uname := c.PostForm("uname")
		password := c.PostForm("password")

		hash, err := bcrypt.GenerateFromPassword([]byte(password), 0)

		if err != nil {
			fmt.Println("HASH ERROR:", err)
		}

		fmt.Println("USER: ", uname, "PASS:", string(hash))
	})

	// RECORDING AND RECORDING TRANSFER
	// This is a feature in development.
	// So far a recording can be started and finished and a file can be downloaded,
	// but no communication is made with the labview program, so a real recording
	// can't be triggered and real data can't be downloaded

	// Tells the server to finish a recording
	// returns the name of the file the recoding is saved to
	r.POST("/finishRecord", func(c *gin.Context) {
		recordStart := c.PostForm("startRec")
		recordEnd := c.PostForm("endRec")
		fmt.Println("Times:", recordStart, recordEnd)

		c.String(http.StatusOK, "FL_insurance_sample.csv")
	})

	// Serves a recoding file based on the filename in the request
	r.GET("/getRecord/:filename", func(c *gin.Context) {
		filename := c.Param("filename")
		fmt.Println(filename)

		data, err := ioutil.ReadFile("RecordedData/" + filename)
		if err != nil {
			fmt.Println(err)
		}

		c.Writer.Header().Set("Content-Disposition", "attachment")
		c.Writer.Header().Set("Content-Type", "application/octet-stream")

		http.ServeContent(c.Writer, c.Request, filename, time.Now(), bytes.NewReader(data))
	})

	// This request returns the current time as known to the server in JSON
	r.GET("/serverTime", func(c *gin.Context) {
		currentTime := time.Now().UTC()
		c.JSON(http.StatusOK, gin.H{
			"serverTime": currentTime,
		})
	})

	// This settting handles Websocket requests using melody
	r.GET("/ws", func(c *gin.Context) {
		m.HandleRequest(c.Writer, c.Request)
	})

	// This handler handles all Websocket messages
	m.HandleMessage(func(s *melody.Session, msg []byte) {

		fmt.Println("MSG:", string(msg))
		
		// This statement checks if the message is from a source (i.e. the LabView program).
		// If the message is from a source it repackages the data and broadcasts it to all
		// authourized clients
		if value, _ := s.Get("source"); value == true {
			handleLVData(string(msg), m, heartbeat);
			return
		}

		// This section authenticates a new Websocket connnection
		//
		// When a new client connects to the server the first message it sends is a copy of its JWT.
		// This JWT is then used to authenticate the client. If the client is authenticated then the
		// 'auth' flag for its session is set to true.
		authorized, _, _ := authenticateToken(string(msg))

		if authorized {
			s.Set("auth", true)
			fmt.Println("CORRECT WEBSOCKET TOKEN")
			if *heartbeat == 2{
				m.BroadcastFilter([]byte(`{"error": "src_disconnect"}`), func(s *melody.Session) bool {
					auth, _ := s.Get("auth")
					return auth == true
				})
			}
			return
		}

		// This statement checks if the message is a registration message from the LabView program.
		//
		// The first message once the LabView program opens a Websocket connection contains a key
		// which will be used to authenticate and register it as a data source. It is registered by
		// setting a "soruce" flag in its session to true.
		if string(msg) == string(getKey()) {
			s.Set("source", true)
			fmt.Println("SOURCE AUTHENTICATED BY KEY")
		}
	})

	// This handler resets the "auth" and "source" flags when a Websocket session disconnects
	m.HandleDisconnect(func(s *melody.Session) {
		s.Set("auth", false)
		s.Set("source", false)
	})

	// Here is where the router is returned
	return r
}

// This function handles data from the LabView program
// Input: data string from LabView, melody session, heartbeat int pointer
// Return: N/a
//
// Future work:
// This function could also be adapted to handle data sent via Websockets as well.
// Keeping this as a separate function is important as this processing can then be
// run concurrently using "go". If this function is called sequentially it can hold
// up the server and keep it from receiveing data after too much data is sent.
func handleLVData(key string, m *melody.Melody, heartbeat *int){
	data, err := formatData(key)
	if err != nil {
		fmt.Println("ERR:", err)
	}else{
		msgFwd := []byte(`{"measurement": ` + buildArray(data) + `, "error": "none"}`)
		fmt.Println("\n" + string(msgFwd) + "\n")
		m.BroadcastFilter(msgFwd, func(s *melody.Session) bool {
			auth, _ := s.Get("auth")
			return auth == true
		})
		*heartbeat = 1
	}
}
