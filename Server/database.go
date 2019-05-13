package main

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"os"
)

// This finction opens the users database
// Input: N/a
// Return: a DB object with the user database
func openUserDB() *sql.DB {
	//Connect to users Database
	dbusr, dberr := sql.Open("mysql", getDatabaseAuth())

	//Database error checking and opening confirmation
	if dberr != nil {
		fmt.Println("SQL INIT ERROR:", dberr)
		os.Exit(1)
		return dbusr
	} else {
		var version string
		dbusr.QueryRow("SELECT VERSION()").Scan(&version)
		fmt.Println("CONNECTED TO:", version)
		return dbusr
	}
}

// This function gets the data for a single user from the users database
// Input: the user's username string, the user database DB object
// Return: the user's username string, full name string, password hash string, userid int, and an error*
//	  *The error field is nil if there are no errors
func getUserData(uname string, dbusr *sql.DB) (string, string, string, int, error) {
	rows, queryerr := dbusr.Query("SELECT * FROM users WHERE username=?", uname)

	if queryerr != nil {
		return "", "", "", -1, queryerr
	}

	var dbuname string
	var dbname string
	var dbpword string
	var dbid int
	for rows.Next() {
		rows.Scan(&dbuname, &dbname, &dbpword, &dbid)
		fmt.Println("ID:", dbid, "UNAME:", dbuname, "PWORD:", dbpword)
	}
	return dbuname, dbname, dbpword, dbid, nil
}
