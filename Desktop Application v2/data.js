const {ipcRenderer} = require("electron");
const {dialog} = require('electron').remote
let $ = require('jquery')
require('./js/chart.js')
const ws = require('./js/ws_connection.js')
const {DOMAIN} = require('./js/const.js')

//Variable initialization
var socket
var page = "front"
var keepTime = 100;
var data = {
	"temp": ["23", "45", "38", "89", "12", "6"],
    "press":["56", "93", "53", "32"],
    "torq":["18", "63"],
    "flow":["27"]
	};
var histData = {
	"temp": [[],[],[],[],[],[]],
	"press": [[],[],[],[]],
	"torq": [[],[]],
	"flow": [[],[]],
	"time": []
};
var histDataNew = {
	"vals": [[],[],[],[],[],[],[]],
	"time": []
}
var histTime = 0
var graphType = 0
var heartbeat = -1

var domain = DOMAIN //This allows the domain to be changed in application

//Data index constants
const SUC_PRESS = 4
const DIS_PRESS = 5
const POWER = 1
const TORQUE = 2
const SPEED = 0
const FLOW = 3
const EFFICIENCY = 6

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

$('#rec-btn').click(function (){
	getServertime()
})

$('#test-btn').click(function (){
	console.log("click")
	$('#downloadNotify').css('opacity', '100')
	setTimeout(function(){$('#downloadNotify').css('opacity', '0')}, 2000)
})

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
	console.log("cool beans")
	ipcRenderer.send("download", {
	    url: "http://" + domain + "/getRecord/" + name,
	    properties: {directory: directory}
	});
	ipcRenderer.on("download complete", (event, file) => {
		console.log("NEAT")
	    console.log(file); // Full file path
	    isRecording = 0;
	    $('#downloadNotify').css('opacity', '100')
	    $('#rec-btn').html("Start Recording");
		$('#rec-btn').css('background-color', '#51b400');
		setTimeout(function(){
			$('#downloadNotify').css('opacity', '0')
		}, 4000)
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
var lGraphData = 0
var rGraphData = 1

$('#lgraph-btn').click(function (){
	changeLeft()
})

$('#rgraph-btn').click(function (){
	changeRight()
})

function changeRight(){
	whichGraph = 'r'
	$('#lgraph-btn').css('background-color', '51b400');
	$('#rgraph-btn').css('background-color', '2e6600');
	$('#graph-data-label').html("Right Graph Data");
	uncheckGraphButtons();
	checkActiveButtons();
}

function changeLeft(){
	whichGraph = 'l'
	$('#lgraph-btn').css('background-color', '2e6600');
	$('#rgraph-btn').css('background-color', '51b400');
	$('#graph-data-label').html("Left Graph Data");
	uncheckGraphButtons();
	checkActiveButtons();
}

$('#inChart').click(
	function(event){
		changeLeft();
	}
)

$('#outChart').click(
	function(event){
		changeRight();
	}
)

$('#spress-btn').click(function (){
	if(whichGraph == 'l'){
		inConfig.data.datasets[0].data = histDataNew.vals[SUC_PRESS]
		inConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Suction Pressure (psi)'
		inConfig.options.scales.yAxes[0].ticks.suggestedMin = -10
		inConfig.options.scales.yAxes[0].ticks.suggestedMax = 50
		lGraphData = SUC_PRESS;
	} else{
		outConfig.data.datasets[0].data = histDataNew.vals[SUC_PRESS]
		outConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Suction Pressure (psi)'
		outConfig.options.scales.yAxes[0].ticks.suggestedMin = -10
		outConfig.options.scales.yAxes[0].ticks.suggestedMax = 50
		rGraphData = SUC_PRESS;
	}

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
})

$('#dpress-btn').click(function (){
	if(whichGraph == 'l'){
		inConfig.data.datasets[0].data = histDataNew.vals[DIS_PRESS]
		inConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Discharge Pressure (psi)'
		inConfig.options.scales.yAxes[0].ticks.suggestedMin = -10
		inConfig.options.scales.yAxes[0].ticks.suggestedMax = 50
		lGraphData = DIS_PRESS;
	} else{
		outConfig.data.datasets[0].data = histDataNew.vals[DIS_PRESS]
		outConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Discharge Pressure (psi)'
		outConfig.options.scales.yAxes[0].ticks.suggestedMin = -10
		outConfig.options.scales.yAxes[0].ticks.suggestedMax = 50
		rGraphData = DIS_PRESS;
	}

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
})

$('#power-btn').click(function (){
	if(whichGraph == 'l'){
		inConfig.data.datasets[0].data = histDataNew.vals[POWER]
		inConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Power (kW)'
		inConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		inConfig.options.scales.yAxes[0].ticks.suggestedMax = 8
		lGraphData = POWER;
	} else{
		outConfig.data.datasets[0].data = histDataNew.vals[POWER]
		outConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Power (kW)'
		outConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		outConfig.options.scales.yAxes[0].ticks.suggestedMax = 8
		rGraphData = POWER;
	}

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
})

$('#torque-btn').click(function (){
	if(whichGraph == 'l'){
		inConfig.data.datasets[0].data = histDataNew.vals[TORQUE]
		inConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Torque (Nm)'
		inConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		inConfig.options.scales.yAxes[0].ticks.suggestedMax = 40
		lGraphData = TORQUE;
	} else{
		outConfig.data.datasets[0].data = histDataNew.vals[TORQUE]
		outConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Torque (Nm)'
		outConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		outConfig.options.scales.yAxes[0].ticks.suggestedMax = 40
		rGraphData = TORQUE;
	}

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
})

$('#speed-btn').click(function (){
	if(whichGraph == 'l'){
		inConfig.data.datasets[0].data = histDataNew.vals[SPEED]
		inConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Speed (rpm)'
		inConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		inConfig.options.scales.yAxes[0].ticks.suggestedMax = 2000
		lGraphData = SPEED;
	} else{
		outConfig.data.datasets[0].data = histDataNew.vals[SPEED]
		outConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Speed (rpm)'
		outConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		outConfig.options.scales.yAxes[0].ticks.suggestedMax = 2000
		rGraphData = SPEED;
	}

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
})

$('#flow-btn').click(function (){
	if(whichGraph == 'l'){
		inConfig.data.datasets[0].data = histDataNew.vals[FLOW]
		inConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Flow (gpm)'
		inConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		inConfig.options.scales.yAxes[0].ticks.suggestedMax = 400
		lGraphData = FLOW;
	} else{
		outConfig.data.datasets[0].data = histDataNew.vals[FLOW]
		outConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Flow (gpm)'
		outConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		outConfig.options.scales.yAxes[0].ticks.suggestedMax = 400
		rGraphData = FLOW;
	}

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
})

$('#eff-btn').click(function (){
	if(whichGraph == 'l'){
		inConfig.data.datasets[0].data = histDataNew.vals[EFFICIENCY]
		inConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Efficiency'
		inConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		inConfig.options.scales.yAxes[0].ticks.suggestedMax = 100
		lGraphData = EFFICIENCY;
	} else{
		outConfig.data.datasets[0].data = histDataNew.vals[EFFICIENCY]
		outConfig.options.scales.yAxes[0].scaleLabel.labelString = 'Efficiency'
		outConfig.options.scales.yAxes[0].ticks.suggestedMin = 0
		outConfig.options.scales.yAxes[0].ticks.suggestedMax = 100
		rGraphData = EFFICIENCY;
	}

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
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