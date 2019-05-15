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

var histDataNew = {
	"vals": [[],[],[],[],[],[],[]],
	"time": []
}
var histTime = 0
var keepTime = 100; // how many data points to cache

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

function addHistValIndex(i, val){
	histDataNew.vals[i].push(val);
}

function addHistTime(){
	histDataNew.time.push(histTime);
	histTime ++;
}

function checkHistOverflow(){
	if(histTime > keepTime){
		for(i = 0; i < histDataNew.vals.length; i++){
			histDataNew.vals[i].shift();
		}
		histDataNew.time.shift()
	}
}

function getEfficiency(){
	return ((9.81 * (histDataNew.vals[5][histDataNew.vals[5].length - 1] * 0.00006309) * ((histDataNew.vals[1][histDataNew.vals[1].length - 1] - histDataNew.vals[0][histDataNew.vals[0].length - 1])/3.2808))/(histDataNew.vals[2][histDataNew.vals[2].length - 1])) * 100
}

function getConfig(whichGraph){
	if(whichGraph == 'l'){
		return inConfig
	}else if(whichGraph == 'r'){
		return outConfig
	}else{
		return null
	}
}

function updateConfig(whichGraph, reading){
	config = getConfig(whichGraph)
	data = chart.graphParams(reading)
	config.data.datasets[0].data = histDataNew.vals[reading]
	config.options.scales.yAxes[0].scaleLabel.labelString = data.name + ' (' + data.unit + ')'
	config.options.scales.yAxes[0].ticks.suggestedMin = data.lower
	config.options.scales.yAxes[0].ticks.suggestedMax = data.upper
}

module.exports = {
	in: inConfig,
	out: outConfig,

	SUC_PRESS: SUC_PRESS,
	DIS_PRESS: DIS_PRESS,
	POWER: POWER,
	TORQUE: TORQUE,
	SPEED: SPEED,
	FLOW: FLOW,
	EFFICIENCY: EFFICIENCY,

	graphParams: graphParams,
	addHistValIndex: addHistValIndex,
	checkHistOverflow: checkHistOverflow,
	addHistTime: addHistTime,
	getEfficiency: getEfficiency,
	getConfig: getConfig,
	updateConfig: updateConfig
}