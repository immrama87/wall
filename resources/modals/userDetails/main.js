var controller = (function(target){
	var user, server;
	
	target.init = function(){
		user = target.userDetails.getUser();
		
		target.name.innerHTML = generateDetail("Name", user.FirstName + " " + user.LastName);
		target.userName.innerHTML = generateDetail("Username", user.UserName);
		
		server = target.userDetails.getServer();
		target.editButtons.style.display="none";
		target.changePassword.style.display = "none";
		getUserDetails();
	}
	
	target.edit.onclick = function(){
		target.name.innerHTML = generateDetail("Name", "<input id=\"user.name\" value=\"" + user.FirstName + " " + user.LastName + "\"/>");
		target.userName.style.display="none";
		target.createDate.style.display="none";
		target.modifiedDate.style.display="none";
		target.lastLogin.style.display="none";
		
		target.defaultButtons.style.display="none";
		target.editButtons.style.display="";
		target.changePassword.style.display = "";
	}
	
	target.changePassword.onclick = function(){
		WindowManager.loadModal("updatePassword", {
			getDetails: function(){
				return {
					user: user.UserName,
					server: server
				};
			}
		});
	}
	
	function getUserDetails(){
		WindowManager.get(server + "/api/users/" + user.UserName, {
			success:	function(data){
				var response = JSON.parse(data);
				
				if(response.status == "success" && response.metadata.size > 0){
					if(response.metadata.size > 1){
						alert("An error has occurred.");
						target.close();
					}
					
					user = response.records[0];
					target.name.innerHTML = generateDetail("Name", user.FirstName + " " + user.LastName);
					target.userName.innerHTML = generateDetail("Username", user.UserName);
					target.createDate.innerHTML = generateDetail("Create Date", WindowManager.formatDate(user.CreateDate));
					target.modifiedDate.innerHTML = generateDetail("Modified Date", WindowManager.formatDate(user.ModifiedDate));
					target.lastLogin.innerHTML = generateDetail("Last Login", WindowManager.formatDate(user.LastLogin));
					
					target.defaultButtons.style.display = "";
					target.editButtons.style.display="none";
					target.changePassword.style.display = "none";
				}
				else {
					alert("Could not retrieve additional user details. An error has occurred.");
					target.close();
				}
			}
		});
	}
	
	function generateDetail(name, value){
		return "<span class=\"detail-name\">" + name + "</span>:<span class=\"detail-value\">" + value + "</span>";
	}
});