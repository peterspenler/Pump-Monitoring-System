package main

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"os"
)

func openUserDB() *sql.DB {
	//Connect to users Database
	dbusr, dberr := sql.Open("mysql", "XXXXX:YYYYY@/users")

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
