define("wallManager/ScrollBars", [], function(){
	return (function(isHorizontal){
		var sb = {};
		
		var x, y, w, h;
		var active = false;
		var context = null;
		
		sb.setX = function(_x){x = _x;}
		sb.setY = function(_y){y = _y;}
		sb.setWidth = function(_w){w = _w;}
		sb.setHeight = function(_h){h = _h;}
		
		sb.getX = function(){return x;}
		sb.getY = function(){return y;}
		sb.getWidth = function(){return w;}
		sb.getHeight = function(){return h;}
		
		sb.show = function(_context){
			active = true;
			context = _context;
		}
		sb.hide = function(){
			active = false;
			context = null;
		}
		sb.isActive = function(){
			return active;
		}
		sb.isHovered = function(mX, mY){
			if(active){
				return mX > x && mX < x + w && mY > y && mY < y + h;
			}
			
			return false;
		}
		sb.getClickOffset = function(evt){
			evt.stopPropagation();
			if(isHorizontal){
				return evt.pageX - x;
			}
			else {
				return evt.pageY - y;
			}
		}
		sb.updatePosition = function(update, bounds){
			if(isHorizontal){
				x+=update;
				if(x <= 0){
					x = 0;
				}
				else if(x + w >= bounds){
					x = bounds - w;
				}
				
				var perc = (x / (bounds - w));
				
				if(context != null){
					context.drawOffset[0] = context.dims[0] * (x / context.canvas.width);
				}
			}
			else {
				y+=update;
				if(y <= 0){
					y = 0;
				}
				else if(y+h >= bounds){
					y = bounds - h;
				}
			}
		}
		
		sb.draw = function(context){
			context.fillStyle = "#CCCCCC";
			context.strokeStyle = "#888888";
			
			context.beginPath();
			if(isHorizontal){
				drawHorizontal(context);
			}
			else {
				drawVertical(context);
			}
			context.fill();
			context.stroke();
		}

		function drawHorizontal(context){
			var em = WindowManager.emSize;
			context.moveTo(x + em, y);
			context.lineTo(x + w - em, y);
			context.quadraticCurveTo(x + w, y, x + w, y + (h / 2));
			context.quadraticCurveTo(x + w, y + h, x + w - em, y + h);
			context.lineTo(x + em, y + h);
			context.quadraticCurveTo(x, y + h, x, y + (h / 2));
			context.quadraticCurveTo(x, y, x + em, y);
		}
		
		function drawVertical(context){
			var em = WindowManager.emSize;
			context.moveTo(x, y + em);
			context.lineTo(x, y + h - em);
			context.quadraticCurveTo(x, y + h, x + (w / 2), y + h);
			context.quadraticCurveTo(x + w, y + h, x + w, y + h - em);
			context.lineTo(x + w, y + em);
			context.quadraticCurveTo(x + w, y, x + (w / 2), y);
			context.quadraticCurveTo(x, y, x, y + em);
		}
		
		return sb;
	});
});