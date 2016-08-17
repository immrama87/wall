var controller = (function(target){
	var details = target.details.getDetails();
	
	getCategoryDetails();
	
	$(target.colorPicker).on("change", function(evt){
		target.color.value = target.colorPicker.value;
		$(target.color).css("background", target.colorPicker.value);
	});
	
	$(target.save).on("click touch", function(evt){
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
			var color = parseHex(data.Color);
			
			WindowManager.get(details.url + "/api/walls/" + details.wallId + "/categories", {
				success:	function(response){
					var cats = JSON.parse(response);
					var valid = true;
					var match = false;
					if(cats.status == "success"){
						for(var i=0;i<cats.records.length;i++){
							var recordColor = parseHex(cats.records[i].Color);
							if(recordColor[0] == color[0] &&
							recordColor[1] == color[1] &&
							recordColor[2] == color[2]
							&& cats.records[i]["_id"] != details.catId){
								valid = confirm("A category with this color already exists. Continue?");
							}
							else if(cats.records[i]["_id"] != details.catId){
								var close = compare(recordColor, color);
								if(close < 0.2){
									match = true;
								}
							}
						}
						
						if(match){
							valid = confirm("At least one category with a similar color already exists. Continue?");
						}
						
						if(valid){
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
					}
					else {
						alert(cats.data);
					}
				}
			});
			
			
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
					
					target.name.value = data.records[0].Name;
					target.color.value = data.records[0].Color;
					target.colorPicker.value = data.records[0].Color;
					$(target.color).css("background", data.records[0].Color);
				}
			});
		}
		else {
			target.color.value = "#FFFFFF";
			target.colorPicker.value = "#FFFFFF";
		}
	}
	
	function parseHex(color){
		var c = [];
		c[0] = parseInt(color.substring(1, 3), 16);
		c[1] = parseInt(color.substring(3, 5), 16);
		c[2] = parseInt(color.substring(5), 16);
		return c;
	}
	
	function compare(color1, color2){
		var rDiff = Math.abs(color1[0] - color2[0]) / 255;
		var gDiff = Math.abs(color1[1] - color2[1]) / 255;
		var bDiff = Math.abs(color1[2] - color2[2]) / 255;
		
		console.log((rDiff + gDiff + bDiff) / 3, color1, color2);
		
		return (rDiff + gDiff + bDiff) / 3;
	}
});