window.onload = function(){
	for(var i=0;i<6;i++){
		addNotePlaceholder();
	}
	
	console.log(window.location.search.substring(window.location.search.indexOf("id=") + ("id=").length));
}

function addNotePlaceholder(){
	var placeholder = document.createElement("div");
	placeholder.className = "placeholder";
	
	document.body.appendChild(placeholder);
}