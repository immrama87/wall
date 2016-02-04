var controller = (function(target){
	var details;
	
	target.init = function(){
		details = target.details.getDetails();
	}
	
	target.submit.onclick = function(){
		WindowManager.post(details.url + "/api/walls/" + details.wallId + "/notes", {DisplayText: target.displayText.value}, {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					if(response.data.insertedCount > 0){
						target.details.returnDetails(response.data.insertedIds[0], target.displayText.value);
					}
					target.close();
				}
				else {
					alert(response.data);
				}
			}
		});
	}
});