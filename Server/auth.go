package main

import (
	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
	"time"
	"fmt"
)

// This function checks whether a password string matches a hash
// Input: hash string, password string
// Return: error if the password and hash do not match, nil otherwise
func verifyPassword(hash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// This function creates a JWT for a new session
// Input: username string, full name string, user id int
// Return: JWT string, JWT expiry Time
func createLoginToken(dbuname string, dbname string, dbid int) (string, time.Time) {
	exptime := time.Now().UTC().Add(30 * time.Minute)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": dbuname,
		"name":     dbname,
		"id":       dbid,
		"exptime":  exptime,
	})

	tokenStr, _ := token.SignedString(getJWTSecret())

	return tokenStr, exptime
}

// Session status constants
const SESSION_EXPIRED = 0
const SESSION_INVALID = 1
const SESSION_VALID = -1

// This function checks the validity of JWTs
// Input: JWT string
// Return: session valid boolean, mapping of JWT claims, session status int
func authenticateToken(tok string) (bool, jwt.MapClaims, int) {
	if tok == "" {
		return false, nil, SESSION_EXPIRED
	}

	token, err := jwt.Parse(tok, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return getJWTSecret(), nil //getJWTSecret() should be in key.go
	})

	if err != nil {
		return false, nil, SESSION_INVALID
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		exptime, err := time.Parse("2006-01-02T15:04:05.000000000Z", claims["exptime"].(string))
		
		if err != nil {
			return false, nil, SESSION_INVALID
		}

		if exptime.After(time.Now().UTC()) {
			return true, claims, SESSION_VALID
		} else {
			return false, nil, SESSION_EXPIRED
		}
	} else {
		return false, nil, SESSION_INVALID
	}
}
