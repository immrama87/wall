define("windowManager/Modals", [], function(){
	var m = {};
	
	var modalBase = "./resources/modals/";
	
	
	m.loadModal = function(url, func){
		loadHTML(modalBase + url, func);
	}
	
	m.showLoadingModal = function(){
		var modal = document.createElement("div");
		modal.className = "loading";
		var background = document.createElement("div");
		background.className = "modal-background";
		
		background.appendChild(modal);
		document.body.appendChild(background);
		
		modal.close = function(){
			document.body.removeChild(background);
		}

		return modal;
	}
	
	function loadHTML(url, func){
		loadResource(url + "/main.html", function(html){
			var modal = parseModalHTML(html, func);
			loadJS(url, modal, func);
		});
	}
	
	function loadJS(url, modal, func){
		loadResource(url + "/main.js", function(js){
			var script = document.createElement("script");
			script.innerHTML = js;
			document.body.appendChild(script);
			controller(modal);
			document.body.removeChild(script);
			
			loadCSS(url, modal, func);
		});
	}
	
	function loadCSS(url, modal, func){
		loadResource(url + "/main.css", function(css){
			var style = document.createElement("style");
			style.innerHTML = css;
			document.head.appendChild(style);
			
			var background = document.createElement("div");
			background.className = "modal-background";
			
			background.appendChild(modal);
			document.body.appendChild(background);
			modal.close = function(){
				document.head.removeChild(style);
				document.body.removeChild(background);
				
				if(func != undefined && func.close){
					var data;
					if(modal.hasOwnProperty("response")){
						data = modal.response;
					}
					
					func.close(data);
				}
			}
			
			background.onclick = function(){
				modal.close();
			}
			
			modal.onclick = function(evt){
				evt.stopPropagation();
			}
			
			if(modal.hasOwnProperty("init")){
				modal.init();
			}
		});
	}
	
	function loadResource(url, callback){
		var request = new XMLHttpRequest();
		request.onreadystatechange = function(){
			if(request.readyState == 4){
				if(request.status == 200){
					callback(request.responseText);
				}
			}
		}
		
		request.open("GET", url);
		request.send();
	}
	
	function parseModalHTML(html, func){
		var doc = (new DOMParser()).parseFromString(html, "text/html");
		
		var modal = document.createElement("div");
		modal.className = "modal";
		if(doc.body.hasChildNodes()){
			addModalNodes(doc.body.childNodes, modal, func);
			
			for(var i=0;i<doc.body.childNodes.length;i++){
				modal.appendChild(doc.body.childNodes[i]);
			}
		}
		
		return modal;
	}
	
	function addModalNodes(nodes, parent, func){
		var internalFunctions = ["initNav"];
		
		for(var i=0;i<nodes.length;i++){
			if(nodes[i].tagName != undefined && nodes[i].hasAttribute("attr")){
				parent[nodes[i].getAttribute("attr")] = nodes[i];
			}
			
			if(nodes[i].tagName != undefined && nodes[i].hasAttribute("func")){
				if(internalFunctions.indexOf(nodes[i].getAttribute("func")) > -1){
					switch(nodes[i].getAttribute("func")){
						case "initNav":
							nodes[i][nodes[i].getAttribute("func")] = initNav(nodes[i], parent);
							break;
					}
				}
				else if(func.hasOwnProperty(nodes[i].getAttribute("func")) || nodes[i].getAttribute("func").indexOf(";") > -1){
					addEvent(nodes[i], func, parent);
				}
			}
			
			if(nodes[i].hasChildNodes()){
				addModalNodes(nodes[i].childNodes, parent, func);
			}
		}
	}
	
	function addEvent(node, func, target){
		if(node.hasAttribute("func-event")){
			if(node.getAttribute("func").indexOf(";") > -1){
				throw "Only one function can be attached to an event at a time when modals are loaded.";
			}
			var e = node.getAttribute("func-event");
			var f;
			if(e != "keyup" || !node.hasAttribute("func-code")){
				f= function(evt){
					func[node.getAttribute("func")](target);
				};
			}
			else {
				var code = node.getAttribute("func-code");
				if(code.indexOf(",") > -1){
					var codes = code.split(",");
					console.log(codes);
					f = function(evt){
						if(codes.indexOf(evt.keyCode.toString()) > -1){
							func[node.getAttribute("func")](target);
						}
					}
				} else {
					f = function(evt){
						if(evt.keyCode == code){
							func[node.getAttribute("func")](target);
						}
					}
				}
			}
			node.addEventListener(e, f);
		}
		else {
			if(node.getAttribute("func").indexOf(";") > -1){
				var funcs = node.getAttribute("func").split(";");
				
				for(var i=0;i<funcs.length;i++){
					node[funcs[i]] = func[funcs[i]];
				}
			}
			else {
				node[node.getAttribute("func")] = func[node.getAttribute("func")];
			}
		}
	}
	
	function initNav(navElement, modal){
		var lis = navElement.getElementsByTagName("li");
		var panels = [];
		for(var i=0;i<lis.length;i++){
			panels.push(initNavLI(lis[i], navElement));
		}
		
		navElement.select = function(name){
			for(var i=0;i<panels.length;i++){
				if(panels[i] != name){
					modal[panels[i]].style.display="none";
				}
				else {
					modal[panels[i]].style.display="";
				}
			}
			
			for(var i=0;i<lis.length;i++){
				if(lis[i].innerHTML.toLowerCase() == name){
					lis[i].className = "selected";
				}
				else {
					lis[i].className = "";
				}
			}
		}
	}
	
	function initNavLI(navLI, navElement){
		navLI.className = "";
		
		navLI.onclick = function(){
			navElement.select(navLI.innerHTML.toLowerCase());
		}
		
		return navLI.innerHTML.toLowerCase();
	}
	
	return m;
});