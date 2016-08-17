define('stickies/StickyManager', ['stickies/Sticky'], function(Sticky){
	var sm = {};
	
	var canvas, context;
	var stickies;
	var zMap;
	var active;
	var animFrame;
	var url;
	var wallId;
	var categories;
	
	sm.init = function(ctx, cvs, w, u){
		stickies = {};
		zMap = [];
		canvas = cvs;
		context = ctx;
		url = u;
		wallId = w;
		zMap.push([]);
		categories = {};
		
		context.clearRect(0, 0, canvas.width, canvas.height);
		var modal = WindowManager.showLoading();
		
		canvas.onmousemove = checkBounds;
		WindowManager.get(url + "/api/walls/" + wallId + "/categories", {
			success:	function(catData){
				var catResponse = JSON.parse(catData);
				if(catResponse.status == "success"){
					for(var c=0;c<catResponse.records.length;c++){
						categories[catResponse.records[c]["_id"]] = catResponse.records[c].Color;
					}
					console.log(categories);
					WindowManager.get(url + "/api/walls/" + wallId + "/notes", {
						success:	function(data){
							var response = JSON.parse(data);
							if(response.status == "success"){
								for(var i=0;i<response.records.length;i++){
									if(!stickies.hasOwnProperty(response.records[i]["_id"])){
										loadSticky(response.records[i]["_id"]);
									}
									stickies[response.records[i]["_id"]].setName(response.records[i].DisplayText);
									if(response.records[i].categoryId != undefined){
										stickies[response.records[i]["_id"]].setColor(categories[response.records[i].categoryId]);
									}
								}
								
								modal.close();
								getPositions();
							}
							else {
								alert(response.data);
							}
						}
					});					
				}
			}
		});
	}
	
	sm.setContext = function(ctx){
		context = ctx;
		draw();
	}
	
	sm.addSticky = function(){
		WindowManager.loadModal("addSticky", {
			getDetails:	function(){
				return {
					url:	url,
					wallId:	wallId
				}
			},
			returnDetails:	function(id, displayText){
				stickies[id] = new Sticky(id);
				stickies[id].setName(displayText);
				WindowManager.post(url + "/api/walls/" + wallId + "/user/notes/" + id, {X: 25, Y: 25}, {
					success:	function(response){
						checkZ(id, 25, 25);
					}
				})
			}
		});
		
		draw();
	}
	
	sm.getStickies = function(){
		return stickies;
	}
	
	sm.getSticky = function(id){
		return stickies[id];
	}
	
	function checkBounds(evt){
		console.log("Goodbye, World!");
		var activeSticky;
		context.clearRect(0, 0, canvas.width, canvas.height);
		for(var i=0;i<zMap.length;i++){
			for(var j=0;j<zMap[i].length;j++){
				if(stickies[zMap[i][j]].checkBounds(evt.pageX, evt.pageY)){
					activeSticky = [i, j];
				}
				stickies[zMap[i][j]].draw(context);
			}
		}
		
		if(activeSticky != undefined){
			canvas.className = "hover";
			activateSticky(stickies[zMap[activeSticky[0]][activeSticky[1]]]);
		}
		else {
			canvas.className = "";
			canvas.onmousedown = null;
			canvas.ondblclick = null;
			canvas.onmouseup = null;
		}
	}
	
	function activateSticky(sticky){
		canvas.ondblclick = function(evt){
			canvas.onmousemove = null;
			canvas.onmousedown = null;
			canvas.className = "";
			console.log("Hello, World!");
			
			//animFrame = sticky.openForEditing(evt);
			//animate(15, sticky.displayEditor);
		}
		
		canvas.onmousedown = function(evt){
			spliceActive(sticky);
			var offsets = sticky.grab(evt);
			canvas.onmousemove = function(evt){
				sticky.updatePosition(evt, offsets);
				draw();
			}
			
			canvas.onmouseup = function(mouseup){
				animFrame = sticky.drop();
				animate(3, function(){
					checkZ(sticky.id, mouseup.pageX - offsets[0], mouseup.pageY - offsets[1]);
					canvas.onmousedown = null;
					canvas.onmousemove = checkBounds;
					active = null;
				});
			}
			
			animFrame = sticky.pickUp();
			animate(3);
		}
	}
	
	function spliceActive(sticky){
		active = sticky;
		for(var i=0;i<zMap.length;i++){
			for(var j=0;j<zMap[i].length;j++){
				if(zMap[i][j] == active.id){
					zMap[i].splice(j, 1);
					return;
				}
			}
		}
	}
	
	function animate(stepCount, callback){
		if(stepCount > 0){
			window.requestAnimationFrame(function(){
				animFrame(stepCount);
				draw();
				
				animate(--stepCount, callback);
			});
		}
		else if(callback != undefined){
			callback();
		}
	}
	
	function draw(){
		context.clearRect(0, 0, canvas.width, canvas.height);
		for(var i=0;i<zMap.length;i++){
			for(var j=0;j<zMap[i].length;j++){
				stickies[zMap[i][j]].draw(context);
			}
		}
		
		if(active != undefined){
			active.draw(context);
		}
	}
	
	function loadSticky(id){
		stickies[id] = new Sticky(id);
	}
	
	function getPositions(){
		WindowManager.get(url + "/api/walls/" + wallId + "/user/notes", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					var ids = [];
					
					response.records.sort(function(a,b){
						if(a.ModifiedDate < b.ModifiedDate){
							return -1;
						}
						else if(a.ModifiedDate > b.ModifiedDate){
							return 1;
						}
						else {
							return 0;
						}
					});
					
					for(var i=0;i<response.records.length;i++){
						var position = {
							pageX:	response.records[i].X,
							pageY:	response.records[i].Y
						};
						
						stickies[response.records[i].Parent].updatePosition(position, [0,0]);
						
						checkZ(response.records[i].Parent, response.records[i].X, response.records[i].Y, true);
					}
					
					draw();
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function checkZ(id,x,y,isLoad){
		var found = false;
		var z;
		for(var i=zMap.length-1;i>=0;i--){
			for(var j=0;j<zMap[i].length;j++){
				if(stickies[zMap[i][j]].collidesWith(stickies[id])){
					if(zMap[i+1] == undefined){
						zMap.push([]);
					}
					z=i+1;
					
					found = true;
					break;
				}
			}
		}
	
		if(!found){
			z=0;
		}
		
		zMap[z].push(id);
		
		if(!isLoad){
			WindowManager.put(url + "/api/walls/" + wallId + "/user/notes/" + id, {X: x, Y: y, Z: z}, {
				success:	function(data){
					var response = JSON.parse(data);
					if(response.status != "success"){
						alert(response.data);
					}
				}
			});
		}
	}
	
	return sm;
});