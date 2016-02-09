var controller = (function(target){
	var colors = ["#B5FFE0", "#BBB5FF", "#FFB5D4", "#F9FFB5", "#FF6666", "#B3FF66", "#66FFFF", "#B366FF"];
	var details = target.details.getDetails();
	
	WindowManager.get(details.url + "/api/walls/" + details.wallId + "/categories", {
		success:	function(response){
			var data = JSON.parse(response);
			for(var i=0;i<data.records.length;i++){
				if(colors.indexOf(data.records[i].Color) > -1){
					colors.splice(colors.indexOf(data.records[i].Color), 1);
				}
			}
			
			console.log(colors);
			
			getCategoryDetails();
		}
	});
	
	$(target.save).on("click touch touchstart", function(evt){
		var data = {};
		var required = ["Color", "Name"];
		data.Color = target.color.value;
		data.Name = target.name.value;
		
		var missing = [];
		for(var i=0;i<required.length;i++){
			if(data[required[i]] == undefined || data[required[i]] == ""){
				missing.push(required[i]);
			}
		}
		
		if(missing.length > 0){
			alert("The " + missing.join(" and ") + " fields are required to add or update a category.");
		}
		else {
			if(details.catId != undefined){
				WindowManager.put(details.url + "/api/walls/" + details.wallId + "/categories/" + details.catId, data, {
					success:	successCallback
				});
			}
			else {
				WindowManager.post(details.url + "/api/walls/" + details.wallId + "/categories", data, {
					success: 	successCallback
				});
			}
		}
	});
	
	function successCallback(data){
		var response = JSON.parse(data);
		if(response.status == "success"){
			target.close();
		}
		else {
			alert(response.data);
		}
	}
	
	function getCategoryDetails(){
		if(details.catId != undefined){
			WindowManager.get(details.url + "/api/walls/" + details.wallId + "/categories/" + details.catId, {
				success:	function(response){
					var data = JSON.parse(response);
					
					if(colors.indexOf(data.records[0].Color) == -1){
						colors.push(data.records[0].Color);
					}
					
					target.name.value = data.records[0].Name;
					renderColors(data.records[0].Color);
				}
			});
		}
		else {
			renderColors();
		}
	}
	
	function renderColors(color){
		target.color.appendChild(document.createElement("option"));
		for(var i=0;i<colors.length;i++){
			target.color.appendChild(generateColorOption(colors[i]));
		}
		
		if(color != undefined){
			target.color.value = color;
		}
	}
	
	function generateColorOption(color){
		var option = document.createElement("option");
		option.value = color;
		option.style.backgroundColor = color;
		option.appendChild(document.createTextNode(color));
		
		return option;
	}
});