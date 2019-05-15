var isRecording = 0;
var startRec
var endRec

function recordCallback(time){
	if(isRecording == 1){
		endRec = time
		console.log('E:' + endRec)
		if(endRec != ""){
			isRecording = -1;
			$.post( "http://" + domain + "/finishRecord", {startRec: startRec, endRec: endRec}, function(result){
				console.log(result)
				$('#rec-btn').html("Downloading");
				$('#rec-btn').css('background-color', '#d8b124');
				dialog.showOpenDialog({title: "Save Recording", defaultPath: "things.csv", properties: ['openDirectory']}, (fileName) => {
					console.log(fileName[0])
					console.log(result)
					downloadFile(result, fileName[0])
				});
			});

		}
	}else if(isRecording == 0){
		startRec = time
		console.log('S:' + startRec)
		if(startRec != ""){
			isRecording = 1;
			$('#rec-btn').html("Stop Recording");
			$('#rec-btn').css('background-color', '#bb5100');
		}
	}
}

function downloadFile(name, directory){
	isRecording = 0;
	$('#rec-btn').html("Start Recording");
	$('#rec-btn').css('background-color', '#51b400');
	ipcRenderer.send("download", {
	    url: "http://" + domain + "/getRecord/" + name,
	    properties: {directory: directory}
	});
	ipcRenderer.on("download complete", (event, file) => {
	    console.log(file); // Full file path
		notify("Download Complete!")
	});
}

function getServertime(){
	time = ""
	$.ajax({
		type: "GET",
		url: "http://" + domain + "/serverTime",
		timeout: 1000,
		success: function(data, textStatus){
			recordCallback(data.serverTime)
		},
		error: function(XMLHttpRequest, textStatus, errorThrown){
			alert("Cannot reach server")	
		}
	})
}

module.exports = {
	getServertime: getServertime
}