var controller = (function(target){
	var details;
	
	target.init = function(){
		details = target.details.getDetails();
		
		buildCategories();
	}
	
	target.submit.onclick = function(){
		WindowManager.post(details.url + "/api/walls/" + details.wallId + "/notes", {DisplayText: target.displayText.value, categoryId: target.category.value}, {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					if(response.data.insertedCount > 0){
						target.details.returnDetails(response.data.insertedIds[0], target.displayText.value, target.category.value);
					}
					target.close();
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function buildCategories(){
		WindowManager.get(details.url + "/api/walls/" + details.wallId + "/categories", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					for(var i=0;i<response.records.length;i++){
						target.category.appendChild(createCategoryOption(response.records[i]));
					}
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function createCategoryOption(category){
		var option = document.createElement("option");
		$(option).css({
			"background": 	category.Color,
			"color":	  	"#FFFFFF",
			"text-shadow":	"1px 1px 0.125em black"
		});
		option.text = category.Name;
		option.value = category["_id"];
		
		return option;
	}
});