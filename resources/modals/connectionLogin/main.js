var controller = (function(target){
	target.init = function(){
		target.login.focus();
	}
	
	target.tryLogin = function(url, callbacks){
		var user = target.login.value;
		var pass = target.pass.value;
		
		var request = new XMLHttpRequest();
		request.onreadystatechange = function(){
			if(request.readyState == 4){
				if(request.status == 200){
					var response = JSON.parse(request.responseText);
					callbacks.success(response.nsessionId);
				}
			}
		}
		
		request.open("POST", url);
		request.withCredentials = true;
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.send("UserName=" + user + "&Password=" + pass);
	}
});