var controller = (function(target){
	var details;
	
	target.init = function(){
		details = target.details.getDetails();
	}
	
	target.save.onclick = function(){
		if(target.newPass.value == target.confirmPass.value){
			WindowManager.put(details.server + "/api/users/" + details.user + "/password", {OldPassword: target.oldPass.value, NewPassword: target.newPass.value}, {
				success: function(data){
					var response = JSON.parse(data);
					
					console.log(response);
				}
			});
		}
		else {
			alert("The confirmed password does not match the new password!");
		}
	}
});