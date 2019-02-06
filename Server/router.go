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
	//"os"
	//"io"
	"io/ioutil"
)

func initRouter(m *melody.Melody, usrDB *sql.DB) *gin.Engine {

	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/login", func(c *gin.Context) {
			c.Writer.WriteHeader(http.StatusUnauthorized)
		})
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

	r.GET("/", func(c *gin.Context) {
		fmt.Println("ROOT REQUEST")
	})

	//Posts username and hashed password to console for private user addition
	r.GET("/genusr", func(c *gin.Context) {
		http.ServeFile(c.Writer, c.Request, "genusr.html")
	})

	r.POST("/genusr", func(c *gin.Context) {
		uname := c.PostForm("uname")
		password := c.PostForm("password")

		hash, err := bcrypt.GenerateFromPassword([]byte(password), 0)

		if err != nil {
			fmt.Println("HASH ERROR:", err)
		}

		fmt.Println("USER: ", uname, "PASS:", string(hash))
	})

	//Handles Data Recording
	r.POST("/finishRecord", func(c *gin.Context) {
		recordStart := c.PostForm("startRec")
		recordEnd := c.PostForm("endRec")
		fmt.Println("Times:", recordStart, recordEnd)

		c.String(http.StatusOK, "FL_insurance_sample.csv")
	})

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

	r.GET("/serverTime", func(c *gin.Context) {
		currentTime := time.Now().UTC()
		c.JSON(http.StatusOK, gin.H{
			"serverTime": currentTime,
		})
	})

	//Handles WebSocket requests
	r.GET("/ws", func(c *gin.Context) {
		m.HandleRequest(c.Writer, c.Request)
	})

	//Handles webSocket message
	m.HandleMessage(func(s *melody.Session, msg []byte) {

		fmt.Println("MSG:", string(msg))
		
		if value, _ := s.Get("source"); value == true {
			//fmt.Println("SOURCE MSG RECEIVED")
			data, _ := formatData(string(msg))
			//fmt.Println(data)

			msgFwd := []byte(`{"measurement": ` + buildTable(data, "Temperature", 13) + `}`)

			m.BroadcastFilter(msgFwd, func(s *melody.Session) bool {
				auth, _ := s.Get("auth")
				return auth == true
			})
			return
		}

		authorized, _, _ := authenticateToken(string(msg))

		if authorized {
			s.Set("auth", true)
			fmt.Println("CORRECT WEBSOCKET TOKEN")
			return
		}

		if string(msg) == string(getKey()) {
			s.Set("source", true)
			fmt.Println("SOURCE AUTHENTICATED BY KEY")
		}
	})

	m.HandleDisconnect(func(s *melody.Session) {
		s.Set("auth", false)
		s.Set("source", false)
	})

	return r
}
