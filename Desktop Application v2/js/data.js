const {ipcRenderer} = require("electron");
const {dialog} = require('electron').remote
let $ = require('jquery')
require('./js/chart.js')
const ws = require('./js/ws_connection.js')
const {DOMAIN} = require('./js/const.js')

//Variable initialization
var socket
var keepTime = 100; // how many data points to cache
var histDataNew = {
	"vals": [[],[],[],[],[],[],[]],
	"time": []
}
var histTime = 0


var domain = DOMAIN //This allows the domain to be changed in application

//Data index constants
const SUC_PRESS = 4
const DIS_PRESS = 5
const POWER = 1
const TORQUE = 2
const SPEED = 0
const FLOW = 3
const EFFICIENCY = 6

const SUC_PRESS_DATA = {name: "Suction Pressure",
						upper: 50,
						lower: -10,
						unit: "psi"}
const DIS_PRESS_DATA = {name: "Discharge Pressure",
						upper: 50,
						lower: -10,
						unit: "psi"}
const POWER_DATA = {	name: "Power",
						upper: 8,
						lower: 0,
						unit: "kW"}
const TORQUE_DATA = {	name: "Torque",
						upper: 40,
						lower: 0,
						unit: "Nm"}
const SPEED_DATA = {	name: "Speed",
						upper: 2000,
						lower: 0,
						unit: "rpm"}
const FLOW_DATA = {		name: "Flow",
						upper: 400,
						lower: 0,
						unit: "gpm"}
const EFFICIENCY_DATA = {name: "Efficiency",
						upper: 100,
						lower: 0,
						unit: "%"}

//Hide images and table which are not visible in the first window
$('#disconnect-alert').hide()

//Connects the WebSocket
ws.connect()
ws.heartbeat()

//Chart initialization
var inConfig = {
	type:"line",
	data:{
		labels:histDataNew.time,
		datasets:[{
			data:histDataNew.vals[SUC_PRESS],
			fill:false,
			borderColor:"rgb(81, 180, 000)",
			lineTension:0.1
		}]},
	options:{
		responsive: true,
  		maintainAspectRatio: false,
		tooltips:{
			enabled: false
		},
		scales:{
			xAxes:[{
				display: false
			}],
			yAxes:[{
				scaleLabel:{
					display:true,
					labelString: 'Suction Pressure (psi)'
				},
				ticks:{
					suggestedMin: -10,
					suggestedMax: 50
				}
			}]	
		},
		animation:{
			duration: 400
		},
		legend:{
			display: false
		},
		elements:{
			point:{
				radius: 1
			}
		},
		events: ['click']
	}
}

var outConfig = {
	type:"line",
	data:{
		labels:histDataNew.time,
		datasets:[{
			data:histDataNew.vals[DIS_PRESS],
			fill:false,
			borderColor:"rgb(81, 180, 000)",
			lineTension:0.1
		}]},
	options:{
		responsive: true,
  		maintainAspectRatio: false,
		tooltips:{
			enabled: false
		},
		scales:{
			xAxes:[{
				display: false
			}],
			yAxes:[{
				scaleLabel:{
					display:true,
					labelString: 'Discharge Pressure (psi)'
				},
				ticks:{
					suggestedMin: -10,
					suggestedMax: 50
				}
			}]	
		},
		animation:{
			duration: 200
		},
		legend:{
			display: false
		},
		elements:{
			point:{
				radius: 1
			}
		},
		events: ['click']
	}
}

var inChart = new Chart(document.getElementById("inChart"), inConfig);
var outChart = new Chart(document.getElementById("outChart"), outConfig);

//DATA RECORDING FUNCTIONS

var isRecording = 0;
var startRec
var endRec

notify("Click on graphs, then use the nav bar to change what they show", 4000)

$('#rec-btn').click(function (){
	getServertime()
})

$('#test-btn').click(function (){
	console.log("click")
	notify("This is a notification")
})

function notify(msg, length = 2000){
	$('#downloadNotify').text(msg)
	$('#downloadNotify').css('opacity', '100')
	setTimeout(function(){
		$('#downloadNotify').css('opacity', '0')
	}, length)
}

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

//GRAPH MODIFICATION FUNCTIONS

var whichGraph = 'l'
var lGraphData = SUC_PRESS
var rGraphData = DIS_PRESS
checkActiveButtons()

$('#inChart').click(
	function(event){
		whichGraph = 'l'
		$('#graph-data-label').html("Left Graph Data");
		uncheckGraphButtons();
		checkActiveButtons();
	}
)

$('#outChart').click(
	function(event){
		whichGraph = 'r'
		$('#graph-data-label').html("Right Graph Data");
		uncheckGraphButtons();
		checkActiveButtons();
	}
)

function updateGraph(reading){
	var config
	if(whichGraph == 'l'){
		config = inConfig
		lGraphData = reading
	}else{
		config = outConfig
		rGraphData = reading
	}
	data = graphParams(reading)
	config.data.datasets[0].data = histDataNew.vals[reading]
	config.options.scales.yAxes[0].scaleLabel.labelString = data.name + ' (' + data.unit + ')'
	config.options.scales.yAxes[0].ticks.suggestedMin = data.lower
	config.options.scales.yAxes[0].ticks.suggestedMax = data.upper

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
}

function graphParams(reading){
	switch(reading){
		case SUC_PRESS:
			return SUC_PRESS_DATA
		case DIS_PRESS:
			return DIS_PRESS_DATA
		case POWER:
			return POWER_DATA
		case TORQUE:
			return TORQUE_DATA
		case SPEED:
			return SPEED_DATA
		case FLOW:
			return FLOW_DATA
		case EFFICIENCY:
			return EFFICIENCY_DATA
	}
}

$('#spress-btn').click(function (){
	updateGraph(SUC_PRESS)
})

$('#dpress-btn').click(function (){
	updateGraph(DIS_PRESS)
})

$('#power-btn').click(function (){
	updateGraph(POWER)
})

$('#torque-btn').click(function (){
	updateGraph(TORQUE)
})

$('#speed-btn').click(function (){
	updateGraph(SPEED)
})

$('#flow-btn').click(function (){
	updateGraph(FLOW)
})

$('#eff-btn').click(function (){
	updateGraph(EFFICIENCY)
})

function uncheckGraphButtons(){
	$('#spress-btn').css('background-color', '51b400');
	$('#dpress-btn').css('background-color', '51b400');
	$('#power-btn').css('background-color', '51b400');
	$('#torque-btn').css('background-color', '51b400');
	$('#speed-btn').css('background-color', '51b400');
	$('#flow-btn').css('background-color', '51b400');
	$('#eff-btn').css('background-color', '51b400');
}

function checkActiveButtons(){
	var activeType = -1
	if(whichGraph == 'l'){
		activeType = lGraphData;
	}else{
		activeType = rGraphData;
	}
	switch(activeType){
		case SUC_PRESS:
			$('#spress-btn').css('background-color', '2e6600');
			break;
		case DIS_PRESS:
			$('#dpress-btn').css('background-color', '2e6600');
			break;
		case POWER:
			$('#power-btn').css('background-color', '2e6600');
			break;
		case TORQUE:
			$('#torque-btn').css('background-color', '2e6600');
			break;
		case SPEED:
			$('#speed-btn').css('background-color', '2e6600');
			break;
		case FLOW:
			$('#flow-btn').css('background-color', '2e6600');
			break;
		case EFFICIENCY:
			$('#eff-btn').css('background-color', '2e6600');
			break;
	}

}

//LOG OUT BUTTON
$('#log-out-btn').click(function (){
	window.location.href = "./index.html"
})

$('#change-server-btn').click(function (){
	console.log($('#server-text').val())
	domain = $('#server-text').val();
})

var changingServer = false

$('#server-btn').click(function (){
	if(changingServer){
		$('#change-server').css("display", "none")
		changingServer = false;
	}else{
		$('#change-server').css("display", "block")
		changingServer = true;
	}
})