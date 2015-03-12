jQuery(function($){
	var URL = window.URL || window.webkitURL;
	var $preview = $("#preview");
	$preview.on("append",function($e,$ret){
		$ret = $($ret);
		console.log(arguments);
		$wrap = $("<div class='clipper'></div>");
		$cover = $("<div class='cover'></div>");
		$wrap.width("50%");
		$wrap.append($ret);
		$wrap.append($cover);
		$ret.width("100%");
		$(this).append($wrap);
		console.log("appended");
	})
	
	var $renderer = $("#renderer");
	var $rencon = $renderer[0].getContext("2d");
	var ws = new WebSocket("ws://"+window.location.hostname+":"+window.location.port);
	var editor = new Editor("#io");
	editor.setPreview($preview);
	var iframeids = {};
	window.provideVideo = function(id,video){
		if(!iframeids[id]) throw new Error("bad iframe");
		iframeids[id].data("videoelem",video);
    iframeids[id][0].naturalHeight = video.naturalHeight;
    iframeids[id][0].naturalWidth = video.naturalWidth;
	};
	window.removeFrame = function(id){
		if(!iframeids[id]) throw new Error("bad iframe");
		setTimeout(function(){
			iframeids[id].parent().remove();
			delete iframeids[id];
		},1);
	};

	function compileProperties($parent,$clipper,$actual){
		var p_dims = {x:$parent.width(), y:$parent.height()};
		var c_dims = {x:$clipper.width(), y:$clipper.height()};
		var actual = $actual[0];
		var a_scale = {
			x:actual.naturalWidth/$actual.width(), 
			y:actual.naturalHeight/$actual.height()
		};

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

	function renderImage(video, ops){
    var renderScale = {
      x:$renderer.width()/ops.parent_dim.x,
      y:$renderer.height()/ops.parent_dim.y
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

	(function renderToCanvas(){
    $rencon.clearRect(0,0,$renderer.width(),$renderer.height());
		$preview.children().each(function(){
			var $element = $(this);
			var $actual = $(this).children();
			if($actual.css("visibility") == "hidden") return;
			var videoelem;
			switch($actual[0].tagName){
				case "VIDEO": 
					if(this.ended) return;
					if(this.paused) return;
					videoelem = $actual[0];
					if(!videoelem.naturalHeight || !videoelem.naturalWidth){
						return console.log("need naturalHeight and naturalWidth");
					}
					break;
				case "IMG": videoelem = $actual[0]; break
				case "IFRAME": 
					videoelem = $actual.data("videoelem"); 
					if(!videoelem) return;
					if(!videoelem.naturalHeight || !videoelem.naturalWidth){
						return console.log("need naturalHeight and naturalWidth");
					}
					$actual.height(videoelem.naturalHeight*$actual.width()/videoelem.naturalWidth);
					break;
        default: throw new Error("bad type");
			}
			renderImage(
        videoelem, 
        compileProperties(
          $preview, 
          $element, 
          $actual
        )
      );
		});
		var str = $renderer[0].toDataURL("image/png");
		str = str.substring(str.indexOf("base64,")+7);
		if(ws.readyState == 1) ws.send(str);
		requestAnimationFrame(renderToCanvas);
	})();
});

