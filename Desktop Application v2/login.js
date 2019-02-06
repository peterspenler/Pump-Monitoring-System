let $ = require('jquery')
const {ipcRenderer} = require("electron");

$('#login-button').on('click', checkLogin)

function checkLogin(){     
	console.log("USER: " + $('#uname').val() + " PASS:" + $('#password').val());

	$.ajax({
		type: "POST",
		url: "http://localhost:5000/api/login",
		data: {uname: $('#uname').val(), password: $('#password').val()},
		timeout: 1000,
		success: function(msg){
			ipcRenderer.send("setCookie", {
			    name: "jwt",
			    data: msg.jwt,
			    exptime: msg.exptime,
			});
			window.location.href = "./stats.html"
		},
		error: function(XMLHttpRequest, textStatus, errorThrown){

			//REMOVE ME BEFORE RELEASE
			window.location.href = "./stats.html"
			//BREAKS AUTHENTICATION

			if(textStatus === "timeout"){
				$('#error-text').text("Cannot Reach Server")	
			}
			else{
				$('#error-text').text("Incorrect Username or Password")	
			}
		}
	})

	console.log("DONE")	
}

$('#uname').keypress(function(e) {
	if(e.which == 13){
		checkLogin()
	}
})

$('#password').keypress(function(e) {
	if(e.which == 13){
		checkLogin()
	}
})