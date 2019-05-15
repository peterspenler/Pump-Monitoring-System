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
			socket.send(cookie[0].value)
		})
	}

	socket.onmessage = function(msg){

		data = JSON.parse(msg.data)

		if(data.error == "none"){

			$('#disconnect-alert').hide()

			$('#n1').text(String(data.measurement[chart.SUC_PRESS]).substring(0,6));
			$('#n2').text(String(data.measurement[chart.DIS_PRESS]).substring(0,6));
			//$('#n3').text(String(data.measurement[chart.POWER]).substring(0,6));
			$('#n4').text(String(data.measurement[chart.TORQUE]).substring(0,6));
			$('#n5').text(String(data.measurement[chart.SPEED]).substring(0,6));
			$('#n6').text(String(data.measurement[chart.FLOW]).substring(0,6));

			for(var i = 0; i < 6; i++){
				chart.addHistValIndex(i, parseFloat(data.measurement[i]))
			}

			var efficiency = chart.getEfficiency()

			if(isNaN(efficiency)){
				efficiency = 0;
			}

			$('#n7').text(efficiency.toFixed(3))

			chart.addHistValIndex(6, efficiency)
			chart.addHistTime()
			chart.checkHistOverflow()

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