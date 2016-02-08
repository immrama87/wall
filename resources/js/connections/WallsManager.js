define("connectionManager/WallsManager", ["wallManager"], function(WallManager){
	var wm = {};
	
	var wallFrame = document.getElementById("wallsList");
	
	wm.create = function(name, url, walls){
		return new WallView(name, url, walls);
	}
	
	function WallView(name, url, walls){
		var wv = this;
		
		wv.init = function(){
			WindowManager.addWindow(name + " - Walls", {
				view:		"walls",
				manager:	wv
			});
		}
		
		wv.load = function(){
			renderWalls();
		}
			
		wv.add = function(){
			WindowManager.loadModal("addWall", {
				add:	function(target){
					WindowManager.post(url + "/api/walls", {Name: target.name.value, Description: target.desc.value}, {
						success:	function(data){
							var response = JSON.parse(data);
							if(response.status == "success"){
								for(var i=0;i<response.data.insertedCount;i++){
									walls.push({
										Name: 			response.data.ops[i].Name,
										Description:	response.data.ops[i].Description,
										_id:			response.data.ops[i]._id
									});
								}
								
								target.close();
								renderWalls();
							}
							else {
								alert(response.data);
							}
						}
					});
				}
			});
		}
		
		wv.settings = function(){
			WindowManager.loadModal("connectionSettings", {
				getDetails:	function(){
					return {name: name, url: url};
				}
			});
		}
		
		function renderWalls(){
			var divs = wallFrame.getElementsByClassName("wall-icon");
			
			while(divs[0]){
				wallFrame.removeChild(divs[0]);
			}
			
			for(var i=0;i<walls.length;i++){
				wallFrame.appendChild(generateWallDiv(walls[i], url));
			}
			
			var clearFix = document.createElement("div");
			clearFix.className = "clearfix";
			
			wallFrame.appendChild(clearFix);
		}
	}
	
	function generateWallDiv(wall, url){
		var container = document.createElement("div");
		container.className = "col-xs-6 col-md-3";
		
		var div = document.createElement("div");
		div.className = "wall-icon";
		container.appendChild(div);
		
		var h2 = document.createElement("h2");
		h2.appendChild(document.createTextNode(wall.Name));
		div.appendChild(h2);
		
		var p = document.createElement("p");
		if(wall.Description != ""){
			p.appendChild(document.createTextNode(wall.Description));
		}
		else {
			p.appendChild(document.createTextNode("No Description"));
		}
		div.appendChild(p);
		
		div.onclick = function(){
			WallManager.init(wall.Name, wall._id, url);
		}
		
		var buttons = document.createElement("div");
		buttons.className = "buttons";
		
		var editBtn = document.createElement("div");
		editBtn.className = "edit";
		buttons.appendChild(editBtn);
		
		var delBtn = document.createElement("div");
		delBtn.className = "delete";
		buttons.appendChild(delBtn);
		
		div.appendChild(buttons);
		
		return container;
	}
	
	return wm;
});