const {ipcRenderer} = require("electron");
const {dialog} = require('electron').remote
const ws = require('./js/ws_connection.js')
const {DOMAIN} = require('./js/const.js')
const chart = require('./js/chartConfig.js')
const download = require('./js/download.js')
let $ = require('jquery')
require('./js/chart.js')

//Variable initialization
var socket

var domain = DOMAIN //This allows the domain to be changed in application

//Hide images and table which are not visible in the first window
$('#disconnect-alert').hide()

//Connects the WebSocket
ws.connect()
ws.heartbeat()

//Chart initialization
var inChart = new Chart(document.getElementById("inChart"), chart.in);
var outChart = new Chart(document.getElementById("outChart"), chart.out);

//Startup instructional notification
notify("Click on graphs, then use the nav bar to change what they show", 4000)

function notify(msg, length = 2000){
	$('#downloadNotify').text(msg)
	$('#downloadNotify').css('opacity', '100')
	setTimeout(function(){
		$('#downloadNotify').css('opacity', '0')
	}, length)
}

// GRAPH VARIABLES AND INITIALIZATION
var whichGraph = 'l'
var lGraphData = chart.SUC_PRESS
var rGraphData = chart.DIS_PRESS
checkActiveButtons()

// FUNCTIONS FOR ALL CLICKABLE OBJECTS
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

$('#rec-btn').click(function (){
	download.getServertime()
})

$('#test-btn').click(function (){
	console.log("click")
	notify("This is a notification")
})

$('#spress-btn').click(function (){
	updateGraph(chart.SUC_PRESS)
})

$('#dpress-btn').click(function (){
	updateGraph(chart.DIS_PRESS)
})

$('#power-btn').click(function (){
	updateGraph(chart.POWER)
})

$('#torque-btn').click(function (){
	updateGraph(chart.TORQUE)
})

$('#speed-btn').click(function (){
	updateGraph(chart.SPEED)
})

$('#flow-btn').click(function (){
	updateGraph(chart.FLOW)
})

$('#eff-btn').click(function (){
	updateGraph(chart.EFFICIENCY)
})

// This function updates the selected graph to the inputted reading
function updateGraph(reading){
	if(whichGraph == 'l'){
		lGraphData = reading
	}else{
		rGraphData = reading
	}
	
	chart.updateConfig(whichGraph, reading)

	inChart.update()
	outChart.update()
	uncheckGraphButtons()
	checkActiveButtons()
}

// This function visibly unchecks (i.e. turns to light green) all graph option buttons
function uncheckGraphButtons(){
	$('#spress-btn').css('background-color', '51b400');
	$('#dpress-btn').css('background-color', '51b400');
	$('#power-btn').css('background-color', '51b400');
	$('#torque-btn').css('background-color', '51b400');
	$('#speed-btn').css('background-color', '51b400');
	$('#flow-btn').css('background-color', '51b400');
	$('#eff-btn').css('background-color', '51b400');
}

// This function visibly checks (i.e. turns dark green) the selected graph option button
function checkActiveButtons(){
	var activeType = -1
	if(whichGraph == 'l'){
		activeType = lGraphData;
	}else{
		activeType = rGraphData;
	}
	switch(activeType){
		case chart.SUC_PRESS:
			$('#spress-btn').css('background-color', '2e6600');
			break;
		case chart.DIS_PRESS:
			$('#dpress-btn').css('background-color', '2e6600');
			break;
		case chart.POWER:
			$('#power-btn').css('background-color', '2e6600');
			break;
		case chart.TORQUE:
			$('#torque-btn').css('background-color', '2e6600');
			break;
		case chart.SPEED:
			$('#speed-btn').css('background-color', '2e6600');
			break;
		case chart.FLOW:
			$('#flow-btn').css('background-color', '2e6600');
			break;
		case chart.EFFICIENCY:
			$('#eff-btn').css('background-color', '2e6600');
			break;
	}

}

//LOG OUT BUTTON AND CHANGE SERVER BUTTON
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