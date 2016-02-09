define("connectionManager/ConnectionManager", ["connectionManager/WallsManager"], function(WallsManager){
	var cm = {};
	
	var connList = document.getElementById("connList");
	var connections = [];
	
	cm.init = function(){
		WindowManager.addWindow("Connections", {
			view: 		"connections",
			manager:	cm
		});
		WindowManager.initFunctions(cm);
		updateConnections();
	}
	
	cm.add = function(){
		WindowManager.loadModal("addConnection", {
			close: function(data){
				connections.push(data);
				showConnections();
			}
		});
	}
	
	function updateConnections(){
		WindowManager.get("resources/server/connections.php", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					connections = JSON.parse(response.data).connections;
					showConnections();
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function deleteConnection(name){
		WindowManager.del("resources/server/connections.php", {Name: name}, {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					var name = JSON.parse(response.data).name;
					for(var i=0;i<connections.length;i++){
						if(connections[i].name == name){
							connections.splice(i,1);
							showConnections();
							break;
						}
					}
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function showConnections(){
		var lis = connList.getElementsByTagName("li");
		while(lis[0]){
			lis[0].parentNode.removeChild(lis[0]);
		}
		
		for(var i=0;i<connections.length;i++){
			connList.appendChild(generateConnectionListItem(connections[i].name, connections[i].url));
		}
	}
	
	function generateConnectionListItem(name, url){
		var li = document.createElement("li");
		li.className = "row";
		
		var nameDiv = document.createElement("div");
		nameDiv.className = "col-xs-6";
		nameDiv.appendChild(document.createTextNode(name));
		li.appendChild(nameDiv);
		
		var urlDiv = document.createElement("div");
		urlDiv.className = "col-xs-5";
		urlDiv.appendChild(document.createTextNode(url));
		li.appendChild(urlDiv);
		
		var button = document.createElement("div");
		button.className = "col-xs-1 fa fa-times-circle delete";
		li.appendChild(button);
		
		$(li).on("click touch touchstart", function(evt){
			tryConnection(url, name);
		});
		
		$(button).on("click touch touchstart", function(evt){
			if(confirm("Delete connection " + name + "? This cannot be undone")){
				deleteConnection(name);
			}
			else {
				evt.stopPropagation();
			}
		});
		
		return li;
	}
	
	function tryConnection(url, name){
		WindowManager.get(url+"/api/walls", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "unverified"){
					WindowManager.loadModal("connectionLogin", {
						login: function(target){
							WindowManager.post(url + "/api/users/login", {UserName: target.login.value, Password: target.pass.value}, {
								success:	function(data){
									var response = JSON.parse(data);
									if(response.status == "success"){
										target.close();
										tryConnection(url, name);
									}
									else {
										alert(response.data);
									}
								}
							});
						}
					});
				}
				else if(response.status == "success"){
					WindowManager.check(name + " - Walls", function(){
						WallsManager.create(name, url, response.records).init();
					});
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	return cm;
});