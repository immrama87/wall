var controller = (function(target){
	var users = [];
	var details;
	
	target.init = function(){
		details = target.details.getDetails();
		
		target.name.innerHTML = generateDetail("Name", details.name);
		
		var server = details.url.substring(("http://").length, details.url.lastIndexOf(":"));
		target.server.innerHTML = generateDetail("Server", server);
		
		var port = details.url.substring(details.url.lastIndexOf(":")+1);
		target.port.innerHTML = generateDetail("Port", port);
		
		var lis = target.nav.getElementsByTagName("li");
		for(var i=0;i<lis.length;i++){
			initNavElement(lis[i]);
		}
		
		getUsers(details.url);
		
		selectSection("Details");
	}
	
	function generateDetail(name, value){
		return "<span class=\"detail-name\">" + name + "</span>:<span class=\"detail-value\">" + value + "</span>";
	}
	
	function initNavElement(li){
		li.onclick = function(){
			var lis = target.nav.getElementsByClassName("selected");
			for(var i=0;i<lis.length;i++){
				lis[i].className = "";
			}
			
			selectSection(li.innerHTML);
		}
	}
	
	function getUsers(){
		WindowManager.get(details.url + "/api/users", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					users = response.records;
					generateUsersTable();
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function generateUsersTable(){
		target.userTable.innerHTML = "";
		
		for(var i=0;i<users.length;i++){
			target.userTable.appendChild(generateTableRow(users[i]));
		}
	}
	
	function generateTableRow(user){
		var tr = document.createElement("tr");
		
		var fName = document.createElement("td");
		fName.appendChild(document.createTextNode(user.FirstName));
		tr.appendChild(fName);
		
		var lName = document.createElement("td");
		lName.appendChild(document.createTextNode(user.LastName));
		tr.appendChild(lName);
		
		var uName = document.createElement("td");
		uName.appendChild(document.createTextNode(user.UserName));
		tr.appendChild(uName);
		
		tr.onclick = function(){
			WindowManager.loadModal("userDetails", {
				getUser:		function(){
					return user;
				},
				getServer:		function(){
					return details.url;
				},
				close:			function(){
					getUsers();
				}
			});
		}
		
		return tr;
	}
	
	$(target.addUser).on("click touch", function(evt){
		WindowManager.loadModal("userDetails", {
			getUser:	function(){
				return null;
			},
			getServer:	function(){
				return details.url;
			},
			close:		function(){
				getUsers();
			}
		});
	});
	
	function selectSection(name){
		var lis = target.nav.getElementsByTagName("li");
		for(var i=0;i<lis.length;i++){
			if(lis[i].innerHTML == name){
				lis[i].className = "selected";
				break;
			}
		}
		
		if(name == "Details"){
			target.details.style.display = "";
			target.users.style.display = "none";
		}
		else {
			target.details.style.display = "none";
			target.users.style.display = "";
		}
	}
});