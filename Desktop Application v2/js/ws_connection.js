//WEBSOCKET CONNECTIONS

module.exports = {
	connect: connect,
	heartbeat: heartbeat
}

function connect(){
	console.log("Attempting to connect")
	socket = new WebSocket("ws://" + domain + "/ws")
	
	socket.onopen = function(){
		console.log("Websocket Connected Successfully")
		ipcRenderer.send("authCookie")
		ipcRenderer.on("authCookieReturn", (event, cookie) => {
			console.log(cookie)
			socket.send(cookie[0].value)
		})
	}

	socket.onmessage = function(msg){
		console.log(msg)

		data = JSON.parse(msg.data)

		if(data.error == "none"){

			$('#disconnect-alert').hide()

			$('#n1').text(String(data.measurement[SUC_PRESS]).substring(0,6));
			$('#n2').text(String(data.measurement[DIS_PRESS]).substring(0,6));
			//$('#n3').text(String(data.measurement[POWER]).substring(0,6));
			$('#n4').text(String(data.measurement[TORQUE]).substring(0,6));
			$('#n5').text(String(data.measurement[SPEED]).substring(0,6));
			$('#n6').text(String(data.measurement[FLOW]).substring(0,6));

			for(var i = 0; i < 6; i++){
				histDataNew.vals[i].push(parseFloat(data.measurement[i]));
				if(histTime > keepTime){
					histDataNew.vals[i].shift();
				}
			}

			var efficiency = ((9.81 * (histDataNew.vals[5][histDataNew.vals[5].length - 1] * 0.00006309) * ((histDataNew.vals[1][histDataNew.vals[1].length - 1] - histDataNew.vals[0][histDataNew.vals[0].length - 1])/3.2808))/(histDataNew.vals[2][histDataNew.vals[2].length - 1])) * 100

			if(isNaN(efficiency)){
				efficiency = 0;
			}

			$('#n7').text(efficiency.toFixed(3))

			histDataNew.vals[6].push(efficiency);
			if(histTime > keepTime){
				histDataNew.vals[6].shift();
			}

			histDataNew.time.push(histTime)
			if(histTime > keepTime){
				histDataNew.time.shift()
			}

			histTime++;
			inChart.update();
			outChart.update();
			heartbeat = 1;
		} else if(data.error == "src_disconnect"){
			$('#disconnect-alert').show()
			$('#disconnect-message').text('The server has lost connection to the loop')
			heartbeat = 2
		}
	}
}

function heartbeat(){
	setInterval( function(){
		if(heartbeat == 0){
			$('#disconnect-alert').show()
			$('#disconnect-message').text('Attempting to reconnect to server')
			socket.close()
			connect()
		}else if(heartbeat == 1){
			heartbeat = 0
			$('#disconnect-alert').hide()
		}else if(heartbeat == -1){
			heartbeat = 0
		}
	}, 2000)
}