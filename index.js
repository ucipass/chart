
var moment = require('moment')
var express = require('express')
const http = require('http');
const url = require('url');
var WebSocket = require('ws')
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

var json = {
      labels:[],
      series:[[]]
  }
var json_mins_60 = {
    labels:[],
    series:[[],[],[]]
}
var json_hours_60 = {
    labels:[],
    series:[[],[],[]]
}
var json_days_60 = {
    labels:[],
    series:[[],[],[]]
}
var json_weeks_60 = {
    labels:[],
    series:[[],[],[]]
}
var maxlength = 60
for(let i=0; i<maxlength; i++){
    json.labels.push("")
    json.series[0].push(0)
    json_mins_60.labels.push("")
    json_mins_60.series[0].push(0)
    json_mins_60.series[1].push(0)
    json_mins_60.series[2].push(0)
    json_hours_60.labels.push("")
    json_hours_60.series[0].push(0)
    json_hours_60.series[1].push(0)
    json_hours_60.series[2].push(0)
}

var min_prev = null
var hrs_prev = null

var val_min_max = 0
var val_min_avg = 0
var val_min_sum = 0
var val_min_count = 0
var val_min_min = 100000000

var val_hrs_max = 0
var val_hrs_avg = 0
var val_hrs_sum = 0
var val_hrs_count = 0
var val_hrs_min = 100000000

function addData(data){
    let m_now = moment()
    let t_now = m_now.toISOString()
    let min_now = m_now.get("minutes")
    let hrs_now = m_now.get("hours")

    // ONE HOUR AVG CALC AND SAVE
    if(hrs_prev!= null && hrs_now > hrs_prev || (hrs_now == 00 && hrs_prev == 23 )){
        console.log("calculate hours average for",hrs_prev,"hours")
        console.log("HOURS MAX/MIN/AVG",val_hrs_max,"/",val_hrs_min,"/",val_hrs_avg,"SUM/COUNT",val_hrs_sum,"/",val_hrs_count,"FOR MINUTE:",hrs_now)
        json_hours_60.labels.push(m_now.subtract(1,'hours').format('MMM/D HH:00'))
        json_hours_60.series[0].push(val_hrs_min)
        json_hours_60.series[1].push(val_hrs_avg)
        json_hours_60.series[2].push(val_hrs_max)
        json_hours_60.labels.shift()
        json_hours_60.series[0].shift()
        json_hours_60.series[1].shift()
        json_hours_60.series[2].shift()

        hrs_prev = hrs_now
        val_hrs_max = 0
        val_hrs_avg = 0
        val_hrs_sum = 0
        val_hrs_count = 0
        val_hrs_min = 100000000
    }else{
        if (val_min_max > val_hrs_max){ val_hrs_max = val_min_max}
        if (val_min_min < val_hrs_min){ val_hrs_min = val_min_min}
        val_hrs_count = val_hrs_count + 1
        val_hrs_sum = val_hrs_sum + val_min_avg
        val_hrs_avg = val_hrs_sum/val_hrs_count
        hrs_prev = hrs_now
        console.log("HOURS MAX/MIN/AVG",val_hrs_max,"/",val_hrs_min,"/",val_hrs_avg,"SUM/COUNT",val_hrs_sum,"/",val_hrs_count,"FOR MINUTE:",hrs_now)
    }
    

    // ONE MINUTE AVG CALC AND SAVE
    if(min_prev!= null && min_now > min_prev || (min_now == 0 && min_prev == 59 )){
        console.log("calculate minute average for",min_prev,"minutes")
        console.log("MINUTE MAX/MIN/AVG",val_min_max,"/",val_min_min,"/",val_min_avg,"SUM/COUNT",val_min_sum,"/",val_min_count,"FOR MINUTE:",min_now)
        json_mins_60.labels.push(m_now.subtract(1,'minutes').format('HH:mm:00'))
        json_mins_60.series[0].push(val_min_min)
        json_mins_60.series[1].push(val_min_avg)
        json_mins_60.series[2].push(val_min_max)
        json_mins_60.labels.shift()
        json_mins_60.series[0].shift()
        json_mins_60.series[1].shift()
        json_mins_60.series[2].shift()
        min_prev = min_now
        val_min_max = 0
        val_min_avg = 0
        val_min_sum = 0
        val_min_count = 0
        val_min_min = 100000000

    }else{
        if (data > val_min_max){ val_min_max = data}
        if (data < val_min_min){ val_min_min = data}
        val_min_count = val_min_count + 1
        val_min_sum = val_min_sum + parseFloat(data)
        val_min_avg = val_min_sum/val_min_count
        min_prev = min_now
        console.log("MINUTE MAX/MIN/AVG",val_min_max,"/",val_min_min,"/",val_min_avg,"SUM/COUNT",val_min_sum,"/",val_min_count,"FOR MINUTE:",min_now)
    }

    // LIVE DATA
    json.labels.push(m_now.format('HH:mm:ss'))
    json.series[0].push(data)
    json.labels.shift()
    json.series[0].shift()   
}


wss.on('connection', function (ws,req) {
    const location = url.parse(req.url, true);
    ws.on('error', () => console.log('errored'));
    wss.on('close', function() {
        console.log('connection closed');
    })
    ws.on('message', function (message) {
        
        if(parseFloat(message)){
            console.log('received data: %s', message)
            addData(message)
        }
        else{
            console.log('received non JSON: %s', message)
        }
        wss.clients.forEach(function each(ws) {
            ws.send(JSON.stringify({"json":json,"json_mins_60":json_mins_60,"json_hours_60":json_hours_60}), (error)=>{
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

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
})
app.get('/chartist_custom.css', function (req, res) {
    res.sendFile(__dirname + '/chartist_custom.css');
})
server.listen(8080, function listening() {
    console.log('Listening on %d', server.address().port);
});