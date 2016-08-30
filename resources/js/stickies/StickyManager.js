define('stickies/StickyManager', ['stickies/Sticky', 'wallManager/ViewPort'], function(Sticky, ViewPort){
	var sm = {};
	
	var canvas, context;
	var stickies;
	var zMap;
	var active;
	var animFrame;
	var url;
	var wallId;
	var categories;
	var zoom = 1;
	var zoomLock = false;
	var viewport;
	
	sm.init = function(ctx, cvs, w, u){
		stickies = {};
		zMap = [];
		canvas = cvs;
		context = ctx;
		url = u;
		wallId = w;
		zMap.push([]);
		categories = {};
		viewport = new ViewPort(context, sm);
		sm.draw = viewport.draw;
		
		context.clearRect(0, 0, canvas.width, canvas.height);
		var modal = WindowManager.showLoading();
		
		WindowManager.get(url + "/api/walls/" + wallId + "/categories", {
			success:	function(catData){
				var catResponse = JSON.parse(catData);
				if(catResponse.status == "success"){
					for(var c=0;c<catResponse.records.length;c++){
						categories[catResponse.records[c]["_id"]] = catResponse.records[c].Color;
					}
					WindowManager.get(url + "/api/walls/" + wallId + "/notes", {
						success:	function(data){
							var response = JSON.parse(data);
							if(response.status == "success"){
								for(var i=0;i<response.records.length;i++){
									if(!stickies.hasOwnProperty(response.records[i]["_id"])){
										loadSticky(response.records[i]["_id"]);
									}
									stickies[response.records[i]["_id"]].setName(response.records[i].DisplayText);
									if(response.records[i].categoryId != undefined && categories[response.records[i].categoryId] != undefined){
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
		viewport.draw();
	}
	
	sm.addSticky = function(){
		WindowManager.loadModal("addSticky", {
			getDetails:	function(){
				return {
					url:	url,
					wallId:	wallId
				}
			},
			returnDetails:	function(id, displayText, category){
				stickies[id] = new Sticky(id);
				stickies[id].setName(displayText);
				if(categories[category] != undefined){
					stickies[id].setColor(categories[category]);
				}
				WindowManager.post(url + "/api/walls/" + wallId + "/user/notes/" + id, {X: 25, Y: 25}, {
					success:	function(response){
						checkZ(id, 25, 25);
					}
				});
			}
		});
		
		viewport.draw();
	}
	
	sm.getStickies = function(){
		return stickies;
	}
	
	sm.getZMap = function(){
		return zMap;
	}
	
	sm.getSticky = function(id){
		return stickies[id];
	}
	
	sm.liftSticky = function(sticky){
		spliceActive(sticky);
		animFrame = sticky.pickUp();
		animate(3);
	}
	
	sm.dropSticky = function(sticky, evt){
		animFrame = sticky.drop();
		checkZ(sticky.id, evt.pageX - sticky.offsets[0], evt.pageY - sticky.offsets[1]);
		animate(3, function(){
			sticky.offsets = null;
		});
	}
	
	sm.updateZoom = function(update, evt){
		zoom += update;
		
		var leftOffset = ((evt.pageX * (1 + update)) - evt.pageX);
		var topOffset = ((evt.pageY * (1 + update)) - evt.pageY);
		
		context.drawOffset[0] += leftOffset;
		if(context.drawOffset[0] <= 0){
			context.drawOffset[0] = 0;
		}
		context.drawOffset[1] += topOffset;
		if(context.drawOffset[1] <= 0){
			context.drawOffset[1] = 0;
		}
		
		for(var id in stickies){
			stickies[id].setZoom(zoom);
		}
		viewport.draw();
	}
	
	sm.checkBounds = function(evt){
		var activeSticky;
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.dims = [canvas.width, canvas.height];
		for(var i=0;i<zMap.length;i++){
			for(var j=0;j<zMap[i].length;j++){
				if(stickies[zMap[i][j]].checkBounds(evt.pageX, evt.pageY, context.drawOffset)){
					activeSticky = zMap[i][j];
				}
			}
		}
		
		viewport.draw();
		
		var response = null;
		if(activeSticky != undefined){
			response = stickies[activeSticky];
		}
		
		return response;
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
				viewport.draw();
				animate(--stepCount, callback);
			});
		}
		else if(callback != undefined){
			callback();
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
					
					viewport.draw();
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
		
		viewport.setDims(x, y);
	
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