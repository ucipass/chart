const WebSocket = require('ws');
const moment = require('moment');
const axios = require('axios')
const url = 'ws://127.0.0.1:8080/'
var timer = null

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

function startSimulator(){
    const ws = new WebSocket(url);
    console.log("==============================\nTrying to connect to:",url)
    ws.on('open', function open() {
        console.log('connected');
        test(ws)
    });
    
    ws.on('close', function close() {
      console.log('disconnected from websocket session',url);
      clearInterval(timer);
      timer = null
    });
    
    ws.on('message', function incoming(data) {
      //console.log(`Received Message`);
    });
    ws.on('error', function close(err) {
        console.log('Websocket error for:',err);
        clearInterval(timer);
        timer = null
      });
  
}

setInterval(()=>{
    if (timer == null){
        startSimulator()
    }
},1000)


async function test(ws){
    timer = setInterval(async function timeout() {
        //let random1 = getRandomInt(50)
        //let random2 = getRandomInt(50)
        //let number = random1 + random2
        let number = 0 ; //means it is inaccessible
        try{
            let ts = moment()
            let s = await axios.get('https://google.com')
            let te = moment()
            number = te.diff(ts)
            console.log("Response Time",number,"ms")
        }catch(err){
            number = -1
        }
        ws.send(number);
        console.log(("SENT: "+number).padEnd(10),"-->",url,"on:",moment().format("MMM/DD h:mm:ssA"))
    }, 10000);
}
