define("windowManager/Ajax", [], function(){
	var a = {};
	
	a.get = function(url, callbacks){
		sendRequest("GET", url, undefined, callbacks);
	}
	
	a.post = function(url, data, callbacks){
		sendRequest("POST", url, data, callbacks);
	}
	
	a.put = function(url, data, callbacks){
		sendRequest("PUT", url, data, callbacks);
	}
	
	a.del = function(url, data, callbacks){
		sendRequest("DELETE", url, data, callbacks);
	}
	
	function sendRequest(method, url, data, callbacks){
		var request = new XMLHttpRequest();
		request.onreadystatechange = function(){
			if(request.readyState == 4){
				if(request.status == 200){
					if(callbacks.hasOwnProperty("success")){
						callbacks.success(request.responseText);
					}
				}
				else {
					if(callbacks.hasOwnProperty("error")){
						callbacks.error(request.status, request.responseText);
					}
					else {
						alert("An error has occurred. Please check the system logs for more details.");
					}
				}
			}
		}
		
		request.open(method, url);
		request.withCredentials=true;
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		var payload = "";
		if(data){
			var payloadParts = [];
			for(var k in data){
				payloadParts.push(k + "=" + data[k]);
			}
			
			payload = payloadParts.join("&");
		}
		
		request.send(payload);
	}
	
	return a;
});