define("windowManager/ColorPicker/selector", [], function(){
	var s = {};
	
	s.open = function(parent, color, onsave){
		var div = document.createElement("div");
		
		var node = parent;
		var left = 0;
		var top = 0;
		while(node != undefined){
			left += node.offsetLeft;
			top += node.offsetTop;
			node = node.offsetParent;
		}
		
		$(div).css({
			"position": 		"absolute",
			"left":				left - (WindowManager.emSize * 6),
			"top":				top - (WindowManager.emSize * 6),
			"width":			WindowManager.emSize * 12,
			"height":			WindowManager.emSize * 12
		});
		$(div).addClass("modal");
		
		var selector = document.createElement("canvas");
		$(selector).css({
			"width":		WindowManager.emSize * 8,
			"height":		WindowManager.emSize * 8,
			"margin-left":	WindowManager.emSize * 0.5,
			"margin-top":	WindowManager.emSize * 0.5,
			"background":	"#FFFFFF"
		});
		$(div).append(selector);
		var colorBar = document.createElement("canvas");
		$(colorBar).css({
			"width":		WindowManager.emSize,
			"height":		WindowManager.emSize * 8,
			"margin-left":	WindowManager.emSize * 1.5,
			"margin-top":	WindowManager.emSize * 0.5,
			"background": 	"#FFFFFF"
		});
		$(div).append(colorBar);
		
		$(document.body).append(div);
		
		var selContext = selector.getContext('2d');
		var barContext = colorBar.getContext('2d');
		
		baseColor = [255, 0, 0];
		
		var step = Math.floor((255 * 6) / colorBar.height);
		console.log(step);
		
		for(var y=0;y<colorBar.height;y++){
			barContext.strokeStyle = "rgb(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + ")";
			barContext.beginPath();
			barContext.moveTo(0, y);
			barContext.lineTo(colorBar.width, y);
			barContext.stroke();
			
			if(baseColor[0] == 255 && baseColor[1] < 255 && baseColor[2] == 0){
				baseColor[1] += step;
				if(baseColor[1] > 255){
					baseColor[1] = 255;
				}
			}
			else if(baseColor[0] > 0 && baseColor[1] == 255 && baseColor[2] == 0){
				baseColor[0] -= step;
				if(baseColor[0] < 0){
					baseColor[0] = 0;
				}
			}
			else if(baseColor[0] == 0 && baseColor[1] == 255 && baseColor[2] < 255){
				baseColor[2] += step;
				if(baseColor[2] > 255){
					baseColor[2] = 255;
				}
			}
			else if(baseColor[0] == 0 && baseColor[1] > 0 && baseColor[2] == 255){
				baseColor[1] -= step;
				if(baseColor[1] < 0){
					baseColor[1] = 0;
				}
			}
			else if(baseColor[0] < 255 && baseColor[1] == 0 && baseColor[2] == 255){
				baseColor[0] += step;
				if(baseColor[0] > 255){
					baseColor[0] = 255;
				}
			}
			else if(baseColor[0] == 255 && baseColor[1] == 0 && baseColor[2] > 0){
				baseColor[2] -= step;
				if(baseColor[2] < 0){
					baseColor[2] = 0;
				}
			}
		}
	}
	
	return s;
});