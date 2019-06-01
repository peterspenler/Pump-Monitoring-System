default: test
all: default

test:
	go run auth.go database.go key.go router.go server.go

build:
	go build -o Server auth.go database.go key.go router.go server.go

setup:
	go get github.com/dgrijalva/jwt-go
	go get github.com/gin-gonic/gin
	go get github.com/go-sql-driver/mysql
	go get github.com/olahol/melody
	go get golang.org/x/crypto/bcrypt