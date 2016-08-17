var controller = (function(target){
	var details;
	target.init = function(){
		target.login.focus();
		details = target.details.getDetails();
	}
	
	$(target.loginBtn).on("click touch", function(evt){
		WindowManager.post(details.url + "/api/users/login", {UserName: target.login.value, Password: target.pass.value}, {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					if(!response.message){
						target.close();
					}
					else if(response.message == "Password Update Required"){
						WindowManager.loadModal("updatePassword", {
							getDetails:	function(){
								return {
									user:	target.login.value,
									server:	details.url
								};
							},
							close:	function(){
								target.close();
							}
						});
					}
				}
				else {
					alert(response.data);
				}
			}
		});
	});
	
	$([target.login, target.pass]).on("keyup", function(evt){
		if(evt.which == 13){
			$(target.loginBtn).click();
		}
	});
});