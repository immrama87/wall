define('wallManager/WallManager', ['stickies'], function(StickyManager){
	var wm = {};
	
	var canvas = document.getElementById("wall");
	var context;
	var currentWall, currentURL;
	
	wm.init = function(name, wallId, url){
		if(context == undefined){
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;		
		
			context = canvas.getContext('2d');
		}
		
		WindowManager.addWindow(name, {
			view:		"wall",
			manager:	wm,
			loadData:	{
				wallId:		wallId,
				url:		url
			}
		});
	}
	
	wm.load = function(loadData){
		StickyManager.init(context, canvas, loadData.wallId, loadData.url);
		currentWall = loadData.wallId;
		currentURL = loadData.url;
		
		var resizeInterval = window.setInterval(function(){
			if(canvas.height != window.innerHeight || canvas.width != window.innerWidth){
				canvas.height = window.innerHeight;
				canvas.width = window.innerWidth;
				context = canvas.getContext('2d');
				StickyManager.setContext(context);
			}
		}, 250);
	}
	
	wm.add = function(){
		StickyManager.addSticky();
	}
	
	wm.settings = function(){
		WindowManager.loadModal("wallSettings", {
			getDetails:	function(){
				return {
					wallId: currentWall,
					url:	currentURL
				};
			}
		});
	}
	
	return wm;
});