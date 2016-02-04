define("windowManager/WindowManager", ["windowManager/Modals", "windowManager/Ajax"], function(Modals, Ajax){
	var wm = {};
	
	var connections = document.getElementById("connections");
	var walls = document.getElementById("walls");
	var wall = document.getElementById("wall");
	
	var windows = {};
	var windowList = document.getElementById("windowList");
	
	wm.loadModal = function(name, func){
		Modals.loadModal(name, func);
	}
	
	wm.showLoading = function(){
		return Modals.showLoadingModal();
	}
	
	wm.get = function(url, callbacks){
		Ajax.get(url, callbacks);
	}
	
	wm.post = function(url, data, callbacks){
		Ajax.post(url, data, callbacks);
	}
	
	wm.put = function(url, data, callbacks){
		Ajax.put(url, data, callbacks);
	}
	
	wm.del = function(url, data, callbacks){
		Ajax.del(url, data, callbacks);
	}
	
	wm.showView = function(view){
		switch(view){
			case "connections":
				connections.style.display = "";
				walls.style.display = "none";
				wall.style.display = "none";
				break;
			case "walls":
				connections.style.display = "none";
				walls.style.display = "";
				wall.style.display = "none";
				break;
			case "wall":
				connections.style.display = "none";
				walls.style.display = "none";
				wall.style.display = "";
				break;
		}
	}
	
	wm.addWindow = function(name, data){
		windows[name] = data;
		addWindowTab(name);
	}
	
	wm.openWindow = function(name){
		var lis = windowList.getElementsByTagName("li");
		for(var i=0;i<lis.length;i++){
			if(lis[i].className == "selected"){
				lis[i].className = "";
			}
			
			if(lis[i].nameValue == name){
				lis[i].className = "selected";
			}
		}
		
		if(windows.hasOwnProperty(name)){
			var window = windows[name];
			wm.showView(window.view);
			wm.initFunctions(window.manager);
			if(window.manager.hasOwnProperty("load")){
				var loadData;
				if(window.hasOwnProperty("loadData")){
					loadData = window.loadData;
				}
				
				window.manager.load(loadData);
			}
		}
	}
	
	wm.initFunctions = function(manager){
		var functions = document.getElementById("functions");
		var buttons = functions.getElementsByClassName("function-button");
		
		for(var i=0;i<buttons.length;i++){
			if(manager.hasOwnProperty(buttons[i].getAttribute("function"))){
				var clone = buttons[i].cloneNode(true);
				clone.style.display = "";
				clone.addEventListener("click", manager[clone.getAttribute("function")]);
				
				buttons[i].parentNode.replaceChild(clone, buttons[i]);
			}
			else {
				buttons[i].style.display = "none";
			}
		}
	}
	
	wm.formatDate = function(dateLong){
		var d = new Date(dateLong);
		
		var h = d.getHours();
		var a = "AM";
		if(h > 12){
			h -= 12;
			a = "PM";
		}
		if(h == 0){
			h = 12;
		}
		
		return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + h + ":" + lPad(d.getMinutes(), "0", 2) + " " + a;
	}
	
	function lPad(str, chr, len){
		str = str.toString();
		while(str.length < len){
			str = chr + str;
		}
		
		return str;
	}
	
	function addWindowTab(name){
		var li = document.createElement("li");
		li.appendChild(document.createTextNode(name));
		li.nameValue = name;
		li.onclick = function(){
			wm.openWindow(name);
		}
		
		var div = document.createElement("div");
		if(name != "Connections"){
			div.className = "delete";
			
			div.onclick = function(evt){
				deleteWindow(li);
				evt.stopPropagation();
			}
		}
		
		li.appendChild(div);
		
		
		windowList.appendChild(li);
		
		wm.openWindow(name);
	}
	
	function deleteWindow(li){
		delete windows[li.nameValue];
		if(li.className == "selected"){
			wm.openWindow(li.previousSibling.nameValue);
		}
		windowList.removeChild(li);
	}
	
	return wm;
});