
function imageTest(f){
	return /^image\/.*$/.test(f.type);
}
function videoTest(f){
	if(!/^video\/.*$/.test(f.type)) return false;
	if(!$("#vid_tester")[0].canPlayType(f.type)) return false;
	return true;
}


function Renderer(url,canvas,previewchooser){
	this.$preview = previewchooser;
	this.$renderer = $(canvas);
	this.URL = window.URL || window.webkitURL;
	this.$rencon = $renderer[0].getContext("2d");
	this.ws = new WebSocket(url);
	var self = this;
	(function renderToCanvas(){
    self.$rencon.clearRect(0,0,self.$rencon.width(),self.$rencon.height());
		requestAnimationFrame(renderToCanvas);
		if(!self.$preview) return;
		self.$preview.children().each(function(){
			var $element = $(this);
			var $actual = $(this).children();
			switch($actual[0].tagName){
				case "VIDEO": 
					if(this.ended) return;
					if(this.paused) return;
					return self.renderImage(
            $actual[0], 
            Renderer.compileProperties(
              $preview, 
              $element, 
              $actual
            )
          );
				case "IMG": 
					return self.renderImage(
						$actual[0],
						Renderer.compileProperties(
							$preview, 
							$element, 
							$actual
						)
          );
				case "IFRAME": break;
        default: throw new Error("bad type");
			}
		});
		var str = $renderer[0].toDataURL("image/png");
		str = str.substring(str.indexOf("base64,")+7);
		if(ws.readyState == 1) ws.send(str);
	})();
}

Renderer.prototype.setContext = function(context){
	this.$preview = $(context)
}

Renderer.prototype.renderLayer = function(ops){
    var renderScale = {
      x:this.$renderer.width()/ops.parent_dim.x,
      y:this.$renderer.height()/ops.parent_dim.y
    };
    $rencon.drawImage(
      video, 
      ops.clip.pos.x, 
      ops.clip.pos.y, 
      ops.clip.dim.x,
      ops.clip.dim.y,
      ops.image.pos.x*renderScale.x,
      ops.image.pos.y*renderScale.y,
      ops.image.dim.x*renderScale.x,
      ops.image.dim.y*renderScale.y
    );
}

Renderer.compileProperties = 	function($parent,$clipper,$actual){
	var p_dims = {x:$parent.width(), y:$parent.height()};
	var c_dims = {x:$clipper.width(), y:$clipper.height()};
	var actual = $actual[0];
	var a_scale = {x:actual.naturalWidth/$actual.width(), y:actual.naturalHeight/$actual.height()};

	var c_pos = $clipper.position();
	var a_pos = $actual.position();
	return {
		parent_dim: p_dims,
		image: {
			pos: {
				x: (c_pos.left+a_pos.left), 
				y: (c_pos.top+a_pos.top)
			},
			dim: {
				x: c_dims.x,
				y: c_dims.y
			}
		},
		clip: {
			pos: {
				x: -a_pos.left,
				y: -a_pos.top
			},
			dim: {
				x: c_dims.x*a_scale.x,
				y: c_dims.y*a_scale.y
			}
		}
	};
}



function Preview(container){
	this.$preview = $(container);
}

Preview.prototype.append = function($ret){
	$wrap = $("<div class='clipper'></div>");
	$wrap.width("50%");
	$wrap.append($ret);
	$ret.width("100%");
	this.$preview.append($wrap);
  $wrap.draggable();
	console.log("appended");
}


function StaticControls(previewchooser,controlcontainer){
	this.previewchooser = previewchooser;
	this.$cont = $(controlcontainer);
	this.$cont.find(".image_files").on("change",function($e){
		var e = $e.originalEvent;
		console.log(e);
		var files = e.target.files; // FileList object
		for (var i = 0, f; f = files[i]; i++) {
			if (!imageTest(f) ){
				console.log("did not pass");
				continue;
			}
			console.log("passed");
			var $ret = $("<img />");
			$ret.attr("title",escape(f.name));
			$ret.attr("src",URL.createObjectURL(f));
			previewchooser.append($ret);
		}
	})
	this.$cont.find(".video_files").on("change",function($e){
		var e = $e.originalEvent;
		var files = e.target.files; // FileList object
		for (var i = 0, f; f = files[i]; i++) {
			if (!videoTest(f) ){
				continue;
			}
			var $ret = $("<video />");
			$ret.attr("title",escape(f.name));
			$ret.attr("src",URL.createObjectURL(f));
			previewchooser.append($ret);
		}
  });
	this.$cont.find("a").on("click",function($e){
		e.preventDefault();
		var $ret = $("<iframe />");
		$ret.attr("title",escape(f.name));
		$ret.attr("src",$(this).attr("href"));
		previewchooser.append($ret);
  });

}

