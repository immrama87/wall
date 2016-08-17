define('stickies/Sticky', [], function(){
	var Sticky = (function(id){
		var s = {};
		
		s.id = id;
		s.createDate = new Date().getTime();
		s.modifiedDate = s.createDate;
				
		var name = "";
		var moving = false;
		var comments = [];
		var lastX, lastY, lastHeight, lastWidth;
		var color = "#F9FFB5";
		
		var bounds = {
			x1: 25,
			x2:	175,
			y1:	25,
			y2:	175
		};
		var height = {
			topLeft:	0,
			topRight:	0,
			bottomLeft:	2,
			bottomRight:2
		};
		
		s.setName = function(n){
			name = n;
			s.modifiedDate = new Date().getTime();
		}
		
		s.getName = function(){
			return name;
		}
		
		s.setColor = function(c){
			color = c;
		}
		
		s.addComment = function(comment){
			s.modifiedDate = new Date().getTime();
			comments.push({
				message:	comment,
				date: 		s.modifiedDate
			});
		}
		
		s.checkBounds = function(x,y){
			//Initial "outer" bounds check
			if(!boundsCheck(x, y, 48)){
				height = {
					topLeft:	0,
					topRight:	0,
					bottomLeft:	2,
					bottomRight:2
				};
				return false;
			}
			
			//If it gets this far, do the height calculations
			calculateHeight(x, y);
		
			//Final bounds check
			return boundsCheck(x, y, 0);
		}
		
		s.collidesWith = function(sticky){
			var otherBounds = sticky.getBounds();
			if(otherBounds.x2 < bounds.x1){
				return false;
			}
			if(otherBounds.x1 > bounds.x2){
				return false;
			}
			if(otherBounds.y2 < bounds.y1){
				return false;
			}
			if(otherBounds.y1 > bounds.y2){
				return false;
			}
			
			return true;
		}
		
		s.getBounds = function(){
			return bounds;
		}
		
		function boundsCheck(x, y, mod){
			if(!mod){
				mod = 0;
			}
			if(x < bounds.x1 - mod){
				return false;
			}
			if(x > bounds.x2 + mod){
				return false;
			}
			if(y < bounds.y1 - mod){
				return false;
			}
			if(y > bounds.y2 + mod){
				return false;
			}
			
			return true;
		}
		
		function calculateHeight(x, y){
			//Y Distance calculation
			var y_dist;
			if(y < bounds.y2){
				y_dist = (y - bounds.y1)/(bounds.y2 - bounds.y1);
			}
			else {
				y_dist = 1-((y - bounds.y2) / 48);
			}
			
			//Right X Distance Calculation
			if(x > bounds.x2-100 && x < bounds.x2){
				bR_dist = 1;
			}
			else if(x > bounds.x2){
				bR_dist = Math.abs(x - bounds.x2);
			}
			else {
				bR_dist = Math.abs(bounds.x2 - 100 - x);
			}
			
			var bottomRight = 10*(1-(bR_dist/48));
			bottomRight *= y_dist;
			if(bottomRight < 2){
				bottomRight = 2;
			}
			if(bottomRight > 10){
				bottomRight = 10;
			}
			height.bottomRight = bottomRight;
			
			var bL_dist;
			if(x > bounds.x1 && x < bounds.x1 + 100){
				bL_dist = 1;
			}
			else if(x < bounds.x1){
				bL_dist = Math.abs(x - bounds.x1);
			}
			else {
				bL_dist = Math.abs(bounds.x1 + 100 - x);
			}
			
			var bottomLeft = 10*(1-(bL_dist/48));
			bottomLeft *= y_dist;
			if(bottomLeft < 2){
				bottomLeft = 2;
			}
			if(bottomLeft > 10){
				bottomLeft = 10;
			}
			height.bottomLeft = bottomLeft;
		}
		
		s.grab = function(evt){
			return [evt.pageX - bounds.x1, evt.pageY - bounds.y1];
		}
		
		s.updatePosition = function(evt, offsets){
			var w = bounds.x2 - bounds.x1;
			var h = bounds.y2 - bounds.y1;
			bounds.x1 = evt.pageX - offsets[0];
			bounds.x2 = bounds.x1 + w;
			bounds.y1 = evt.pageY - offsets[1];
			bounds.y2 = bounds.y1 + h;
		}
		
		s.setHeight = function(obj){
			if(!moving){
				height = obj;
			}
		}
		
		/**ANIMATION FRAME RETURN FUNCTIONS**/
		s.pickUp = function(){
			moving = true;
			lastHeight = {
				topLeft: 		height.topLeft,
				topRight:		height.topRight,
				bottomLeft: 	height.bottomLeft,
				bottomRight:	height.bottomRight
			};
			var diff_tl = (10 - height.topLeft) / 2;
			var diff_tr = (10 - height.topRight) / 2;
			var diff_bl = (10 - height.bottomLeft) / 2;
			var diff_br = (10 - height.bottomRight) / 2;
			
			return function(){
				height.topLeft += diff_tl;
				height.topRight += diff_tr;
				height.bottomLeft += diff_bl;
				height.bottomRight += diff_br;
			}
		}
		
		s.drop = function(context){
			var diff_tl = (lastHeight.topLeft - height.topLeft) / 3;
			var diff_tr = (lastHeight.topRight - height.topRight) / 3;
			var diff_bl = (lastHeight.bottomLeft - height.bottomLeft) / 3;
			var diff_br = (lastHeight.bottomRight -height.bottomRight) / 3;
			
			return function(){
				height.topLeft += diff_tl;
				height.topRight += diff_tr;
				height.bottomLeft += diff_bl;
				height.bottomRight += diff_br;
			};
		}
		
		s.openForEditing = function(evt){
			lastX = bounds.x1;
			lastY = bounds.y1;
			lastWidth = bounds.x2 - bounds.x1;
			lastHeight = bounds.y2 - bounds.y1;
			
			var totalWidth = evt.target.width - 80;
			var totalHeight = evt.target.height;
					
			var targetX = (totalWidth/2) - (totalWidth/4);
			var targetY = (totalHeight/2) - (totalHeight/4);
			var targetX2 = targetX + (totalWidth/2);
			var targetY2 = targetY + (totalHeight/2);
						
			height = {
				topLeft:	10,
				topRight:	10,
				bottomLeft:	10,
				bottomRight:10
			};
			
			return function(count){
				var x1_diff = (targetX - bounds.x1)/count;
				var y1_diff = (targetY - bounds.y1)/count;
				var x2_diff = (targetX2 - bounds.x2)/count;
				var y2_diff = (targetY2 - bounds.y2)/count;
				
				bounds.x1 += x1_diff;
				bounds.y1 += y1_diff;
				bounds.x2 += x2_diff;
				bounds.y2 += y2_diff;
			}
		}
		
		s.displayEditor = function(){
			var editorDiv = document.createElement("div");
			editorDiv.className = "editor";
			editorDiv.style.top = bounds.y1 + "px";
			editorDiv.style.left = bounds.x1 + "px";
			editorDiv.style.width = (bounds.x2 - bounds.x1 - 20) + "px";
			editorDiv.style.height = (bounds.y2 - bounds.y1 - 20) + "px";
			document.body.appendChild(editorDiv);
			
			var nameDiv = createNameSection();
			editorDiv.appendChild(nameDiv);
			if(name == ""){
				nameDiv.input.focus();
			}
			
			//Container for Comments items
			var commentsDiv = document.createElement("div");
			commentsDiv.className = "comments";
			
			//Header for Comments section
			var commentsHead = document.createElement("h4");
			commentsHead.appendChild(document.createTextNode("Comments:"));
			commentsDiv.appendChild(commentsHead);
			
			//Container for Comments table
			var commentsDisplay = document.createElement("div");
			commentsDisplay.className = "display";
			
			//Table for rendering submitted comments
			var commentsTable = document.createElement("table");
			var commentsTHead = document.createElement("thead");
			commentsTHead.appendChild(createHeaderRow(["Comment", "Submit Date", "Submitted By"]));
			commentsTable.appendChild(commentsTHead);
			commentsDisplay.appendChild(commentsTable);
			
			if(comments.length == 0){
				var noComments = document.createElement("h4");
				noComments.className = "noComments";
				noComments.appendChild(document.createTextNode("No Comments"));
				
				commentsDisplay.appendChild(noComments);
			}
			else {
				//TODO: Add Comments Table Code
			}
			
			var commentsAdd = document.createElement("button");
			commentsAdd.className = "left";
			commentsAdd.appendChild(document.createTextNode("Add Comment"));
			commentsDisplay.appendChild(commentsAdd);
			
			commentsDiv.appendChild(commentsDisplay);
		
			editorDiv.appendChild(commentsDiv);
			
			var btnDiv = document.createElement("div");
			btnDiv.className = "btnDiv";
			
			var saveBtn = document.createElement("button");
			saveBtn.className = "active";
			saveBtn.appendChild(document.createTextNode("Apply Changes"));
			btnDiv.appendChild(saveBtn);
			
			var cancelBtn = document.createElement("button");
			cancelBtn.appendChild(document.createTextNode("Cancel"));
			btnDiv.appendChild(cancelBtn);
			
			editorDiv.appendChild(btnDiv);
		}
		
		function createNameSection(){
			//Container for Name (Display Text) items
			var nameDiv = document.createElement("div");
			nameDiv.className = "name";
			
			//Header for Name (Display Text)
			var nameHead = document.createElement("h4");
			nameHead.appendChild(document.createTextNode("Display Text:"));
			nameDiv.appendChild(nameHead);
			
			//Input textarea for Name (Display Text)
			var nameInput = document.createElement("textarea");
			nameInput.value = name;
			nameInput.onkeyup = function(evt){
				if(evt.keyCode == 13 && evt.shiftKey){
					nameInput.value = nameInput.value.substring(0, nameInput.value.length - 1);
					nameEdit.click();
				}
			}
			nameDiv.appendChild(nameInput);
			nameDiv.input = nameInput;
			
			//Button for saving/editing Display Text
			var nameEdit = document.createElement("button");
			nameDiv.appendChild(nameEdit);
			
			if(name == ""){
				makeNameEditable();
			}
			else {
				makeNameDisabled();
			}
			
			function makeNameEditable(){
				nameEdit.innerHTML = "";
				nameEdit.appendChild(document.createTextNode("Save"));
				nameEdit.onclick = function(){
					if(nameInput.value != ""){
						if(name != nameInput.value){
							name = nameInput.value;
						}
						makeNameDisabled();
					}
					else {
						alert("A Display Text value is required for all sticky notes.");
						nameInput.focus();
					}
				}
				
				nameEdit.className = "active";
				
				nameInput.removeAttribute("disabled");
				nameInput.focus();
			}
			
			function makeNameDisabled(){
				nameEdit.innerHTML = "";
				nameEdit.appendChild(document.createTextNode("Edit"));
				nameEdit.onclick = makeNameEditable;
				nameEdit.className = "";
				
				nameInput.setAttribute("disabled", true);
			}
			
			return nameDiv;
		}
		
		function createHeaderRow(headers){
			var tr = document.createElement("tr");
			for(var i in headers){
				tr.appendChild(createHeaderCell(headers[i]));
			}
			
			return tr;
		}
		
		function createHeaderCell(header){
			var th = document.createElement("th");
			th.appendChild(document.createTextNode(header));
			
			return th;
		}
		
		/**DRAWING FUNCTIONS**/
		s.draw = function(context, zoom){
			var x = bounds.x1;
			var y = bounds.y1;
			
			if(height.topLeft > 0 || height.topRight > 0 || height.bottomLeft > 0 || height.bottomRight > 0){
				drawShadow(context, x, y);
			}
			
			drawSticky(context, x, y);
			writeText(context, x, y);
			lastX = x;
			lastY = y;
		}
		
		function drawSticky(context, x, y){
			var w = bounds.x2 - bounds.x1;
			var h = bounds.y2 - bounds.y1;
			
			context.beginPath();
			context.fillStyle = color;
			context.moveTo(x-height.topLeft,y-height.topLeft);
			if(height.topLeft == height.topRight){
				context.lineTo(x+w-height.topRight,y-height.topRight);
			}
			else {
				context.bezierCurveTo(x+(w*2/3)-height.topLeft,y-height.topRight,x+w-height.topRight,y-height.topLeft,x+w-height.topRight,y-height.topRight);
			}
			
			if(height.topRight == height.bottomRight){
				context.lineTo(x+w-height.bottomRight,y+h-height.bottomRight);
			}
			else {
				context.bezierCurveTo(x+w-height.topRight,y+(h*2/3)-height.topRight,x+w-height.bottomRight,y+h-height.topRight,x+w-height.bottomRight,y+h-height.bottomRight);
			}
			
			if(height.bottomRight == height.bottomLeft){
				context.lineTo(x-height.bottomLeft,y+h-height.bottomLeft);
			}
			else{
				context.bezierCurveTo(x+(w*2/3)-height.bottomRight,y+h-height.bottomRight,x-height.bottomLeft,y+h-height.bottomRight,x-height.bottomLeft,y+h-height.bottomLeft);
			}
			
			if(height.topLeft == height.bottomLeft){
				context.lineTo(x-height.topLeft,y-height.topLeft);
			}
			else {
				context.bezierCurveTo(x-height.bottomLeft,y+h-height.topLeft,x-height.topLeft,y+(h*2/3)-height.topLeft,x-height.topLeft,y-height.topLeft);
			}
			
			context.fill();
		}
		
		function drawShadow(context, x, y){
			var w = bounds.x2 - bounds.x1;
			var h = bounds.y2 - bounds.y1;
			
			context.beginPath();
			context.fillStyle = "rgba(0,0,0,0.1)";
			/*LEFT-TOP CORNER*/
			context.moveTo(x + height.topLeft, y + height.topLeft);
			context.lineTo(x+w+height.topRight,y+height.topRight);
			
			if(height.topRight == height.bottomRight){
				context.lineTo(x+w+height.bottomRight,y+h+height.bottomRight);
			}
			else {
				context.bezierCurveTo(x+w+height.topRight, y+(h*2/3)+height.topRight, x+w+height.bottomRight, y+h+height.topRight, x+w+height.bottomRight, y+h+height.bottomRight);
			}
			
			if(height.bottomRight == height.bottomLeft){
				context.lineTo(x+height.bottomLeft,y+h+height.bottomLeft);
			}
			else {
				context.bezierCurveTo(x+w+height.bottomLeft,y+h+height.bottomRight,x+(w*2/3)+height.bottomLeft,y+h+height.bottomLeft,x+height.bottomLeft,y+h+height.bottomLeft);
			}
			
			if(height.bottomLeft == height.topLeft){
				context.lineTo(x+height.topLeft, y+height.topLeft);
			}
			else {
				context.bezierCurveTo(x+height.topLeft,y+h+height.bottomLeft,x+height.topLeft,y+(h*2/3)+height.topLeft,x+height.topLeft,y+height.topLeft);
			}
			context.fill();
		}
		
		function writeText(context, x, y){
			var fontSize = 20;
			var words = name.split(" ");
			var line = "";
			var new_y = y + 25-height.topLeft;
			line_height = 25;
			x+=5-height.topLeft;
			context.fillStyle = "#000000";
			
			maxHeight = 150-height.bottomLeft;
			
			var ratio = (height.bottomLeft - height.topLeft)/10;
			
			for(var n=0;n<words.length;n++){
				var testLine = line + words[n] + " ";
				context.font = "20px 'Amatic SC', cursive";
				var test = context.measureText(testLine);
				if(test.width > 140){
					if(line.length > 0){
						if((new_y + line_height) < (y-height.topLeft + maxHeight)){
							drawText(context, line, x, new_y, fontSize);
							new_y+=line_height-ratio;
							x-=ratio;
							fontSize -= ratio/2;
							line = "";
							n-=1;
						}
						else {
							line = line + words[n];
							while(context.measureText(line + "...").width > 140){
								while((line = line.slice(0,-1)).charAt(line.length-1) == " "){};
							}
							
							line = line + "...";
							break;
						}
					}
					else {
						var text = words[n];
						for(var i=0;i<text.length;i++){
							testLine = line + text[i];
							context.font = "20px 'Amatic SC', cursive";
							test = context.measureText(testLine);
							if(test.width > 140){
								if((new_y + line_height) < (y-height.topLeft + maxHeight)){
									drawText(context, line, x, new_y, fontSize);
									new_y+=line_height-ratio;
									x-=ratio;
									line = text[i];
								}
								else {
									while(context.measureText(line + "...").width > 140){
										while((line = line.slice(0,-1)).charAt(line.length-1) == " "){};
									}
									
									line = line + "...";
									
									break;
								}
							}
							else {
								line = testLine;
							}
						}
					}
				}
				else {
					line = testLine;
				}
			}
			drawText(context, line, x, new_y, fontSize);
		}
		
		function drawText(context, text, x, y, fontSize){
			context.font = fontSize + "px 'Amatic SC', cursive";
			context.fillText(text, x, y);
			context.strokeText(text, x, y);
		}
		
		return s;
	});
	
	return Sticky;
});