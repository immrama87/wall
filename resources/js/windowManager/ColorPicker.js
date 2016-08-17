define("windowManager/ColorPicker", ["windowManager/ColorPicker/selector"], function(Selector){
	var cp = {};
	
	cp.create = function(valField){
		return new ColorPicker(valField);
	}
	
	var ColorPicker = (function(valField){
		var c = {};
		c.color = "#FFFFFF";
		
		var pickField = document.createElement("div");
		$(pickField).addClass("picker");
		$(pickField).insertBefore(valField);
		
		var selector = document.createElement("div");
		$(selector).addClass("selector");
		$(pickField).append(selector);
		
		$(selector).on("click touch", function(evt){
			Selector.open(selector, c.color, function(){
			
			});
		})
		
		c.setColor = function(color){
			c.color = color;
			$(selector).css("background", color);
			$(valField).css("background", color);
			$(valField).val(color);
		}
		
		return c;
	});
	
	return cp;
});