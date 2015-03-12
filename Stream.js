var child_process = require("child_process");
var fs = require("fs");

function Stream(ws, out){
	this.ws = ws;
	this.out = out;
	this.ended = false;
	var self = this;
	self.ws.on("message", function(message){
		if(self.ended) return;
		if(!self.child) return;
		self.child.stdin.write(message, "base64");
	});
	self.ws.on("close", function(){
		if(self.child){ 
			self.child.kill();
			clearTimeout(this.timeout)
		}
		console.log("person has left");
	});
	if(out) self.startChild();
}

Stream.prototype.addOut = function(out){
	if(this.child) throw Error("for right now you can't change locations of streams");
	this.out = out;
	this.startChild()
}

Stream.prototype.close = function(){
	this.ws.close();
	
	if(this.child){
		clearTimeout(this.timeout);
		this.child.kill();
	}
	console.log("new stream");
}

Stream.prototype.startChild = function(){
	var self = this;
	console.log("childstarting");
	self.timeout = setTimeout(function(){
		console.log("ended");
		self.ended = true;
		self.ws.close();
		self.child.stdin.end();
	},1000*60*5)
	self.child = child_process.spawn(
		"ffmpeg", 
		[
			"-loop", "1", 
			"-f", "image2pipe",
			"-vcodec", "png",
			"-i", "-", 
			"-c:v", "libx264",
			"-crf", "23", 
			"-r", "15", 
			"-preset", "fast",
			"-g", "60",
			"-pix_fmt", "yuv420p",
			"-s", "720x405",
			"-threads", "0",
		].concat(self.out),
		{ env: process.env }
	);
	self.child.on("error", function(err){
		throw err;
	});
	self.child.stderr.pipe(process.stderr);
	self.child.stdout.pipe(process.stdout);
	self.child.on("close", function(){
		self.ws.close();
		clearTimeout(self.timeout);
		console.log("finished");
	});
}

module.exports = Stream;
