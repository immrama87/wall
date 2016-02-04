var controller = (function(target){
	target.add.onclick = function(){
		var name = target.name.value;
		var server = target.server.value;
		var port = target.port.value;
		
		var missing = [];
		if(!name){
			missing.push("Name");
		}
		if(!server){
			missing.push("Server");
		}
		if(!port){
			missing.put("Port");
		}
		
		if(missing.length > 0){
			var missing_str = missing.join(" and ");
			alert("A value is required for the " + missing_str + " field(s).");
		}
		else if(isNaN(port)){
			alert("The port value must be a number.");
		}
		else {
			var url = "http://" + server + ":" + port;
			sendRequest(name, url);
		}
	};
	
	function sendRequest(name, url){
		var request = new XMLHttpRequest();
		request.onreadystatechange = function(){
			if(request.readyState == 4){
				if(request.status == 200){
					var response = JSON.parse(request.responseText);
					if(response.status == "success"){
						target.response = JSON.parse(response.data);
						target.close();
					}
					else {
						alert(response.data);
					}
				}
			}
		}
		
		request.open("PUT", "resources/server/connections.php");
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.send("Name=" + name + "&Url=" + url);
	}
	
	target.init = function(){
		target.name.focus();
	}
});