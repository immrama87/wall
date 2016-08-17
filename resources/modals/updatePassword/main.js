var controller = (function(target){
	var details;
	
	target.init = function(){
		details = target.details.getDetails();
	}
	
	$(target.save).on("click touch", function(evt){
		if(target.newPass.value == target.confirmPass.value){
			WindowManager.put(details.server + "/api/users/" + details.user + "/password", {OldPassword: target.oldPass.value, NewPassword: target.newPass.value}, {
				success: function(data){
					var response = JSON.parse(data);
					if(response.status == "success"){
						target.close();
					}
					else {
						alert(response.data);
					}
				}
			});
		}
		else {
			alert("The confirmed password does not match the new password!");
		}
	});
	
	$([target.oldPass, target.newPass, target.confirmPass]).on("keyup", function(evt){
		if(evt.which == 13){
			$(target.save).click();
		}
	});
});