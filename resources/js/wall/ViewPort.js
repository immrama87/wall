define("wallManager/ViewPort", ["wallManager/MouseControls", "wallManager/ScrollBars", "stickies/Sticky"], function(MouseControls, ScrollBar, Sticky){
	return (function(context, stickyController){
		var vp = {};
		
		var dims = [0,0];
		var zoomFactor = 1;
		var pos = [0,0];
		var relativeDims = [0,0];
		var viewportDims = [0,0];
		var canvasDims = [context.canvas.width, context.canvas.height];
		
		var scrollbars = {};
		scrollbars.x = new ScrollBar(true);
		scrollbars.x.setX(0);
		scrollbars.x.setY(context.canvas.height - WindowManager.emSize);
		scrollbars.x.setHeight(WindowManager.emSize);
		
		scrollbars.y = new ScrollBar();
		scrollbars.y.setX(context.canvas.width - WindowManager.emSize);
		scrollbars.y.setY(0);
		scrollbars.y.setWidth(WindowManager.emSize);
		
		var zoomControls = document.getElementById("zoom-controls") || createZoomControls();
		zoomControls.updatePercent(zoomFactor);
		
		MouseControls.init(context.canvas, stickyController, scrollbars, vp);
		
		vp.setDims = function(x, y){
			var updateNecessary = false;
			var updateX = parseInt(x) + Sticky.constants.WIDTH;
			if(updateX > dims[0]){
				dims[0] = updateX;
				updateNecessary = true;
			}
			var updateY = parseInt(y) + Sticky.constants.HEIGHT;
			if(updateY > dims[1]){
				dims[1] = updateY;
				updateNecessary = true;
			}
			
			if(updateNecessary){
				factorDims();
			}
		}
		
		function factorDims(){
			relativeDims[0] = (dims[0] * zoomFactor);
			relativeDims[1] = (dims[1] * zoomFactor);
			viewportDims[0] = context.canvas.width / zoomFactor;
			viewportDims[1] = context.canvas.height / zoomFactor;
			
			if(viewportDims[0] < relativeDims[0]){
				scrollbars.x.show();
				scrollbars.x.setWidth((context.canvas.width - WindowManager.emSize) * (viewportDims[0] / relativeDims[0]));
			}
			else {
				scrollbars.x.hide();
			}
			
			if(parseInt(viewportDims[0]) + parseInt(pos[0]) > relativeDims[0]){
				pos[0] = relativeDims[0] - viewportDims[0];
				if(pos[0] < 0){
					pos[0] = 0;
				}
			}
			
			if(viewportDims[1] < relativeDims[1]){
				scrollbars.y.show();
				scrollbars.y.setHeight((context.canvas.height - WindowManager.emSize) * (viewportDims[1] / relativeDims[1]));
			}
			else {
				scrollbars.y.hide();
			}
			
			if(viewportDims[1] + pos[1] > relativeDims[1]){
				pos[1] = relativeDims[1] - viewportDims[1];
				
				if(pos[1] < 0){
					pos[1] = 0;
				}
			}
		}
		
		vp.setContext = function(ctx){
			context = ctx;
			draw();
		}

		vp.draw = draw;
		
		vp.normalizeMouseEvent = function(evt){
			evt.viewportX = evt.pageX - $(context.canvas).offset().left;
			evt.viewportY = evt.pageY - $(context.canvas).offset().top;
			evt.pageX = (((evt.pageX - $(context.canvas).offset().left) / context.canvas.width) * viewportDims[0]) + pos[0];
			evt.pageY = (((evt.pageY - $(context.canvas).offset().top) / context.canvas.height) * viewportDims[1]) + pos[1];
			
			return evt;
		}
		
		vp.updateX = function(evt, offset){
			if(viewportDims[0] < relativeDims[0]){
				var movement = (evt.viewportX - offset);
				var update = scrollbars.x.getX() + movement;
				var movementRange = (context.canvas.width - WindowManager.emSize) - scrollbars.x.getWidth();
				
				if(update < 0){
					update = 0;
				}
				else if(update > movementRange){
					update = movementRange;
				}
				scrollbars.x.setX(update);
				
				var percent = update / movementRange;
				pos[0] = (relativeDims[0] - viewportDims[0]) * percent;
				
				draw();
			}
		}
		
		vp.updateY = function(evt, offset){
			if(viewportDims[1] < relativeDims[1]){
				var movement = (evt.viewportY - offset);
				var update = scrollbars.y.getY() + movement;
				var movementRange = (context.canvas.height - WindowManager.emSize) - scrollbars.y.getHeight();
				
				if(update < 0){
					update = 0;
				}
				else if(update > movementRange){
					update = movementRange;
				}
				scrollbars.y.setY(update);
				
				var percent = update / movementRange;
				pos[1] = (relativeDims[1] - viewportDims[1]) * percent
				
				draw();
			}
		}
		
		vp.updateZoom = function(amount, evt){
			zoomFactor = parseFloat(parseFloat(zoomFactor) + amount).toFixed(1);
			if(zoomFactor < 0.5){
				zoomFactor = 0.5;
			}
			factorDims();
			draw();
			zoomControls.updatePercent(zoomFactor);
		}
		
		vp.fitToViewport = function(){
			var xPerc = canvasDims[0] / dims[0];
			var yPerc = canvasDims[1] / dims[1];
			
			if(xPerc <= yPerc){
				zoomFactor = xPerc;
			}
			else {
				zoomFactor = yPerc;
			}
			
			pos[0] = 0;
			pos[1] = 0;
			
			factorDims();
			draw();
			zoomControls.updatePercent(zoomFactor);
		}
		
		function draw(){
			context.drawOffset = pos;
			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
			var stickies = stickyController.getStickies();
			var zMap = stickyController.getZMap();
			var active = MouseControls.getActive();
			var activeId = (active != null && active.isMoving()) ? active.id : null;
			
			for(var i=0;i<zMap.length;i++){
				for(var j=0;j<zMap[i].length;j++){
					if(zMap[i][j] != activeId){
						stickies[zMap[i][j]].draw(context, zoomFactor);
					}
				}
			}
			
			if(active != null && active.isMoving()){
				active.draw(context);
			}
			
			if(scrollbars.x.isActive()){
				scrollbars.x.draw(context);
			}
			if(scrollbars.y.isActive()){
				scrollbars.y.draw(context);
			}
		}
		
		function createZoomControls(){
			var hover = false;
			var controls = document.createElement("div");
			controls.id = "zoom-controls";
			controls.className = "zoom-controls";
			$(controls).css({
				"left":		(context.canvas.width * 0.75) - (WindowManager.emSize * 10) + "px",
				"top":		$(context.canvas).offset().top + "px",
				"display":	"none"
			});
			
			var zoomMinus = document.createElement("i");
			$(zoomMinus).addClass("fa fa-search-minus");
			$(zoomMinus).attr("title", "Zoom Out");
			$(controls).append(zoomMinus);
			
			$(zoomMinus).on("click touch", function(evt){
				vp.updateZoom(-0.1);
			});
			
			var zoomPerc = document.createElement("p");
			$(controls).append(zoomPerc);
			
			controls.updatePercent = function(factor){
				$(zoomPerc).text("Zoom: " + Math.round(factor * 100) + "%");
				$(controls).css({
					"opacity":	1,
					"display":	"block"
				});
				window.requestAnimationFrame(fade);
			}
			
			var zoomPlus = document.createElement("i");
			$(zoomPlus).addClass("fa fa-search-plus");
			$(zoomPlus).attr("title", "Zoom In");
			$(controls).append(zoomPlus);
			
			$(zoomPlus).on("click touch", function(evt){
				vp.updateZoom(0.1);
			});
			
			var zoomReset = document.createElement("i");
			$(zoomReset).addClass("fa fa-arrows-alt");
			$(zoomReset).attr("title", "Fit To Screen");
			$(controls).append(zoomReset);
			
			$(zoomReset).on("click touch", function(evt){
				vp.fitToViewport();
			});
			
			$(document.body).append(controls);
			
			function fade(){
				$(controls).css("opacity", parseFloat($(controls).css("opacity") - 0.01));
				if($(controls).css("opacity") <= 0){
					$(controls).css({
						"opacity": 0,
						"display": "none"
					});
				}
				else if(!hover){
					window.requestAnimationFrame(fade);
				}
			}
			
			$(controls).on("mouseover", function(evt){
				$(controls).css("opacity", 1);
				hover = true;
			});
			
			$(controls).on("mouseout", function(evt){
				hover = false;
				window.requestAnimationFrame(fade);
			});
			
			return controls;
		}
		
		return vp;
	});
});