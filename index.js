var http = require("http");
var express = require("express");
var router = express();
var WebSocketServer = require('ws').Server;
var Stream = require("./Stream");

// rtmp://live.twitch.tv/app/$STREAMKEY

var stream = void(0);

router
.get("/file", function(req,res,next){
	if(!stream) return 	next();
	stream.addOut([req.query.file]);
	res.status(200).end("yes stream");
}).get("/url", function(req,res,next){
	if(!stream) return next();
	stream.addOut(["-f", "flv", req.query.url]);
	res.status(200).end("yes stream");
}).get("/",function(req,res){
	res.sendFile(__dirname+"/browser/index.html");
}).get("/*",express.static(__dirname+"/browser"));




var server = http.createServer();
server.on("request",router);
var wss = new WebSocketServer({ server: server })
wss.on('connection', function connection(ws) {
	if(stream) stream.close();
	stream = new Stream(ws);
});

server.listen(3000);
