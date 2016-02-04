var controller = (function(target){
	target.init = function(){
		target.nav.select("categories");
		
		loadTable();
	}
	
	function loadTable(){
		var details = target.catTable.getDetails();
		
		WindowManager.get(details.url + "/api/walls/" + details.wallId + "/categories", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					generateTable(response.records);
				}
			}
		});
	}
	
	function generateTable(categories){
		var thead = document.createElement("thead");
		var tbody = document.createElement("tbody");
		
		var headerRow = document.createElement("tr");
		var colorCell = document.createElement("th");
		colorCell.appendChild(document.createTextNode("Color"));
		headerRow.appendChild(colorCell);
		
		var nameCell = document.createElement("th");
		nameCell.appendChild(document.createTextNode("Name"));
		headerRow.appendChild(nameCell);
		thead.appendChild(headerRow);
		
		for(var i=0;i<categories.length;i++){
			tbody.appendChild(createRow(categories[i]));
		}
		
		for(var j=categories.length;j<10;j++){
			tbody.appendChild(createRow(undefined));
		}
		
		target.catTable.appendChild(thead);
		target.catTable.appendChild(tbody);
	}
	
	function createRow(category){
		var name, color;
		if(category != undefined){
			name = category.Name;
			color = category.Color;
		}
		else {
			name = color = "";
		}
		
		var tr = document.createElement("tr");
		var colorCell = document.createElement("td");
		var colorDiv = document.createElement("div");
		colorDiv.className = "color-div";
		colorDiv.style.background = color;
		colorCell.appendChild(colorDiv);
		colorCell.appendChild(document.createTextNode(color));
		tr.appendChild(colorCell);
		
		var nameCell = document.createElement("td");
		nameCell.appendChild(document.createTextNode(name));
		tr.appendChild(nameCell);
		
		return tr;
	}
});