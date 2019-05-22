package main
// This is a dummy file
// fill this file with your own keys and data
func getKey() []byte{
	return []byte("INSERT KEY HERE")
}

func getJWTSecret() []byte{
	return []byte("INSERT JWT SECRET HERE")
}

func getDatabaseAuth() string{
	return "USER:PASS@/TABLE?interpolateParams=true"
	//Replace USER, PASS, and TABLE with values
}
