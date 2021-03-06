
var moment = require('moment')
var express = require('express')
const http = require('http');
const url = require('url');
const WebSocket = require('ws')
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const Mychart = require('ucipass-chart')
var chart = new Mychart("sensor")
var msg = {
    json : {
        labels:[],
        series:[[]]
    },
    json_mins_60 : {
      labels:[],
      series:[[],[],[]]
    },
    json_hours_60 : {
      labels:[],
      series:[[],[],[]]
    },
    json_days_60 : {
      labels:[],
      series:[[],[],[]]
    },
    json_weeks_60 : {
      labels:[],
      series:[[],[],[]]
    }
}

async function main(number){
    await chart.logMin.startFileLog()
    await chart.logHour.startFileLog()
    await chart.logDay.startFileLog()
    await chart.logWeek.startFileLog()
    wsServer()
    httpServer()
}

function wsServer(){
    wss.on('connection', function (ws,req) {
        const location = url.parse(req.url, true);
        ws.on('error', () => console.log('errored'));
        wss.on('close', function() {
            console.log('connection closed');
        })
        ws.on('message', function (message) {
            if(isNaN(parseFloat(message))){
                console.log('received non number:', message)
            }
            else{
                message = parseFloat(message)
                console.log('received data:', message)
                chart.log(message,moment())
            }
            wss.clients.forEach(function each(ws) {
                msg.json = chart.getChartSecond()
                msg.json_mins_60 = chart.getChartMinute()
                msg.json_hours_60 = chart.getChartHour()
                msg.json_days_60 = chart.getChartDay()
                msg.json_weeks_60 = chart.getChartWeek()
                ws.send(JSON.stringify(msg), (error)=>{
                    if(error == undefined){
                        return;
                    }
                    else{
                        console.log("Async error:"+error);
                        ws.terminate()
                    }
                })
            });
        })
    })    
}

function httpServer(){
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html');
    })
    app.get('/chartist_custom.css', function (req, res) {
        res.sendFile(__dirname + '/chartist_custom.css');
    })
    
    app.use(express.static(__dirname));
    
    server.listen(8080, function listening() {
        console.log('Listening on %d', server.address().port);
    });
}

main()