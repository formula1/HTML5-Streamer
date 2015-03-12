
function Editor(container){
	this.$c = $(container);
	this.$c.accordion();
	this.$vidtest = this.$c.find("video.tester");
	this.$c.find("input.image_files[type=file]").on("change",this.imageUpload.bind(void(0),this));
	this.$c.find("input.video_files[type=file]").on("change",this.videoUpload.bind(void(0),this));
	this.$c.find(".inputs a").on("click",this.captureUserMedia.bind(void(0),this));
	this.$c.find(".outputs form").on("submit", this.specifyOutput.bind(void(0),this));
	this.$l = this.$c.find(".layers");
	this.$l.sortable({
		stop: function(e, ui){
			console.log("sorted");
			console.log(ui);
			var $item = $(ui.item)
			var $elem = $($item.data("elem")).parent();
			var index = $item.index();
			console.log(index);
			var $before = $elem.siblings(":eq("+index+")");
			if($before.size() === 0){
				$elem.parent().append($elem);
			}else{
				$before.before($elem);
			}
		}
	});
}

Editor.prototype.imageTest = function(f){
	return /^image\/.*$/.test(f.type);
}
Editor.prototype.videoTest = function(f){
	if(!/^video\/.*$/.test(f.type)) return false;
	if(!this.$vidtest[0].canPlayType(f.type)) return false;
	return true;
}

Editor.prototype.setPreview = function(p){
	this.$l.empty();
	if(this.$p){
		this.p.off("append");
	}
	this.$p = $(p);
	var self = this;
	this.$p.on("append", this.addLayer.bind(this));
	this.$p.children().each(function(){
		self.addLayer($(this));
	});
}
Editor.prototype.addLayer = function($e,$elem){
	$elem = $($elem);
	$wrap = $elem.parent();
  $wrap.draggable();
	$wrap.resizable({
		aspectRatio:true,
		alsoResize:$elem
	});
	console.log("adding a layer?");
	var uid = "_"+Math.floor(Math.random()*1000000);
	$item = $($(".layer_template")[0].innerHTML);
	["visible", "focus", "move", "resize", "crop"].forEach(function(label){
		$item.find("#"+label).attr("id", label+uid);
		$item.find("[for="+label+"]").attr("for", label+uid);
	});
	$item.find(".name").text($elem.attr("title")||$elem[0].title.tagName);
  $item.find( ".visible" ).button();
	$item.find( ".visible" ).on("change", function(){
		console.log("visibility");
		var val = !!$(this).prop("checked");
		$elem.css("visibility", val?"visible":"hidden");
	});
  $item.find( ".focus" ).button();
	$item.find( ".focus" ).on("change", function(){
		console.log("focus");
		var val = !!$(this).prop("checked");
		console.log(val);
		$elem.siblings(".cover").css("z-index",val?50:3).animate({
			opacity: val?0.25:0,
			"background-color": val?"#000":"#FFF"
		}, 5000);
	});
	$item.data("elem", $elem);
	this.$l.append($item);

}

Editor.prototype.imageUpload = function(self,$e){
	$e.preventDefault();
	var e = $e.originalEvent;
	var files = e.target.files;
	if(!self.$p) throw Error("No Preview");
	for (var i = 0, f; f = files[i]; i++) {
		if (!self.imageTest(f) ){
			console.log("did not pass");
			continue;
		}
		console.log("passed");
		var $ret = $("<img />");
		$ret.attr("title",f.name);
		$ret.attr("src",URL.createObjectURL(f));
		$ret.data("type", "image");
		self.$p.trigger("append",$ret);
	}
}

Editor.prototype.videoUpload = function(self,$e){
	$e.preventDefault();
	var e = $e.originalEvent;
	var files = e.target.files;
	if(!self.$p) throw Error("No Preview");
	for (var i = 0, f; f = files[i]; i++) {
		if (!self.videoTest(f) ){
			continue;
		}
		var $ret = $("<video autoplay=true loop='loop' />");
		$ret.attr("title",f.name);
		$ret.attr("src",URL.createObjectURL(f));
		$ret[0].addEventListener("loadedmetadata", function(e){
			console.log(e);
			$ret[0].naturalWidth = $ret[0].videoWidth
			$ret[0].naturalHeight = $ret[0].videoHeight
		});
		$ret.data("type", "video");

		self.$p.trigger("append",$ret);
	}
}

Editor.prototype.captureUserMedia = function(self,$e){
		$e.preventDefault();
		if(!self.$p) throw Error("No Preview");
		var $ret = $("<iframe />");
		var href = $(this).attr("href");
		var id = Date.now();
		href += (href.indexOf("?") !== -1?"&":"?")+"id="+id;
		$ret.attr("src",href);
		$ret.data("type", "usermedia");
		self.$p.trigger("append",$ret);
		iframeids[id] = $ret;
} 

Editor.prototype.specifyOutput = function(self,$e){
	$e.preventDefault();
	var $this = $(this);
	$.get($this.attr("action"), $this.serialize())
	.done(function(data){
		console.log("ok: "+data);
	}).fail(function(err){
		console.error("not ok: "+err);
	})
}



