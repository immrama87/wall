var controller = (function(target){
	$(target.approvalDiv).hide();
	$(target.notificationDiv).hide();
	
	var details = target.details.getDetails();
	if(details.actionKey != undefined){
		WindowManager.get(details.url + "/api/walls/" + details.wallId + "/actions/" + details.actionKey, {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					if(response.records.length == 0){
						alert("No action with the specified key was found for this wall. Contact a system administrator for more details.");
					}
					else if(response.records.length > 1){
						alert("More than one action definition was found for this action key. Contact a system administrator for more details.");
					}
					else {
						target.action.value = details.actionKey;
						target.action.disabled = true;
						if(response.records[0].Approval == "true"){
							target.approval.checked = true;
							target.approvalType.value = response.records[0].ApprovalType;
							$(target.approvalDiv).show();
						}
						if(response.records[0].Notification == "true"){
							target.notification.checked = true;
							target.notificationText.value = response.records[0].NotificationText;
							$(target.notificationDiv).show();
						}
					}
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	$(target.approval).on("change", function(evt){
		if($(target.approval).is(":checked")){
			$(target.approvalDiv).show();
		}
		else {
			$(target.approvalDiv).hide();
		}
	});
	
	$(target.notification).on("change", function(evt){
		if($(target.notification).is(":checked")){
			$(target.notificationDiv).show();
		}
		else {
			$(target.notificationDiv).hide();
		}
	});
	
	$(target.save).on("click touch", function(evt){
		var obj = {};
		obj.ActionKey = target.action.value;
		obj.Approval = $(target.approval).is(":checked");
		obj.Notification = $(target.notification).is(":checked");
		var valid = true;
		if(obj.Approval){
			obj.ApprovalType = target.approvalType.value;
		}
		if(obj.Notification){
			obj.NotificationText = target.notificationText.value;
			if(obj.NotificationText == undefined || obj.NotificationText == ""){
				alert("No notification text was entered, but notifications were set to send. Enter notification text and try again.");
				valid = false;
			}
		}
		
		if(valid){
			if(details.actionKey == undefined){
				WindowManager.post(details.url + "/api/walls/" + details.wallId + "/actions", obj, {
					success:	successFunction
				});
			}
			else {
				WindowManager.put(details.url + "/api/walls/" + details.wallId + "/actions/" + details.actionKey, obj, {
					success:	successFunction
				});
			}
		}
	});
	
	function successFunction(data){
		var response = JSON.parse(data);
		if(response.status == "success"){
			target.close();
		}
		else {
			alert(response.data);
		}
	}
});