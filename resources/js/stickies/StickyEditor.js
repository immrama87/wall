define('stickies/StickyEditor', [], function(){
	var se = {};
	
	se.draw = function(bounds){
		var editorDiv = document.createElement("div");
		editorDiv.className = "editor";
		editorDiv.style.top = bounds.y1 + "px";
		editorDiv.style.left = bounds.x1 + "px";
		editorDiv.style.width = (bounds.x2 - bounds.x1 - 20) + "px";
		editorDiv.style.height = (bounds.y2 - bounds.y1 - 20) + "px";
		
		var nameDiv = document.createElement("div");
		nameDiv.className = "name";
		
		var nameHead = document.createElement("h4");
		nameHead.appendChild(document.createTextNode("Display Text:"));
			
		nameDiv.appendChild(nameHead);
		
		var nameInput = document.createElement("textarea");
		nameInput.value = name;
		nameDiv.appendChild(nameInput);
		
		var nameEdit = document.createElement("button");
		nameDiv.appendChild(nameEdit);
		
		editorDiv.appendChild(nameDiv);
		
		var commentsHead = document.createElement("h4");
		commentsHead.appendChild(document.createTextNode("Comments:"));
			
		editorDiv.appendChild(commentsHead);
			
		document.body.appendChild(editorDiv);
			
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
	}
	
	return se;
});