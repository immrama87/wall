var fs = require("fs");

module.exports = (function(app, express){
	var path = "/api/help/";
	
	app.all(path + "*", function(req, res, next){
		if(req.status == "unverified"){
			fs.readFile("./html/html/login.html", "utf8", function(err, data){
				res.send(generateHTML({}, data));
			});
		}
		else {
			next();
		}
	});
	
	app.get(path, function(req, res){
		fs.readdir("./api/v1.0/", function(err, files){
			if(err){
				res.status(500).end("Error Occurred!");
				console.log(err);
			}
			
			content = {};
			content.routeList = "";
			
			files.sort();
			
			for(var i=0;i<files.length;i++){
				if(files[i] != "help.js"){
					var fileRoute = files[i].substring(0, files[i].indexOf(".js"));
					var objectName = fileRoute.charAt(0).toUpperCase() + fileRoute.substring(1);
					
					content.routeList += "<li><a href='/api/help/" + fileRoute + "/'>" + objectName + "</a></li>";
				}
			}
			
			fs.readFile("./html/html/index.html", "utf8", function(err, data){
				if(err)
					throw err;
				
				res.send(generateHTML(content, data));
			});
		})
	});
	
	app.param("module", function(req, res, next, module){
		req.module = module;
		next();
	});
	
	app.get(path + ":module", function(req, res){
		fs.readFile("./html/html/route-snippet.html", "utf8", function(err, routeSnippet){
			fs.readFile("./api/v1.0/" + req.module + ".js", "utf8", function(err, data){
				var content = {};
				content.routeName = req.module;
				content.routes = "";
				
				var links = [];
				
				var index, offset = 0;
				while((index = data.indexOf("/**", offset)) > -1){
					var end = data.indexOf("*/", index);
					var routeData = data.substring(index + 3, end);
					var routeObj = parseRouteData(routeData);
					if(routeObj.method != undefined && routeObj.path != undefined){
						routeObj["link"] = links.length;
						routeObj["Name"] = routeObj.method + " " + routeObj.path;
						links.push(routeObj["Name"]);
					}
					
					if(routeObj.response != undefined){
						routeObj["Response Fields"] = "<b>Response Fields:</b><ul class='response-fields'>";
						var response_fields = routeObj.response.split(",");
						
						for(var i=0;i<response_fields.length;i++){
							routeObj["Response Fields"] += "<li>" + response_fields[i].trim() + "</li>";
						}
						
						routeObj["Response Fields"] += "<li>_id</li>";
						routeObj["Response Fields"] += "</ul>";
					}
					
					if(routeObj.data != undefined){
						routeObj["Parameters"] = "";
						var param_fields = routeObj.data.split(",");
						
						for(var i=0;i<param_fields.length;i++){
							var optional = optional_text = "";
							if(param_fields[i].indexOf("--optional") > -1){
								param_fields[i] = param_fields[i].substring(0, param_fields[i].indexOf("--optional"));
								optional = "class='optional'";
								optional_text = " (Optional)";
							}
							routeObj["Parameters"] += "<div class='param-field'><div class='param-label'>" + param_fields[i].trim() + ":</div><div class='param-value'><input " + optional + "type='text' />" + optional_text + "</div></div>";
						}
					}
					
					var routeHTML = generateHTML(routeObj, routeSnippet);
					
					content.routes += routeHTML;
					
					offset = index + 3;
				}
				
				var linkHTML = "";
				for(var i=0;i<links.length;i++){
					linkHTML += "<div class='route-link'><a href='#" + i + "'>" + links[i] + "</a></div>";
					
					var index, offset = 0;
					while((index = content.routes.indexOf(links[i], offset)) > -1){
						var tagStart = content.routes.lastIndexOf("<", index);
						var tagEnd = content.routes.indexOf(">", tagStart) + 1;
						var tag = content.routes.substring(tagStart, tagEnd);
						if(tag != "<h1>"){
							content.routes = content.routes.substring(0, index) + "<a href='#" + i + "'>" + links[i] + "</a>" + content.routes.substring(index + links[i].length);
						}
						
						offset = content.routes.indexOf("</a>", index);
					}
				}
				
				content.links = linkHTML;
				
				fs.readFile("./html/html/route.html", "utf8", function(err, route){
					res.send(generateHTML(content, route));
				});
			});
		});
	});
	
	function generateHTML(data, template){
		var index = 0;
		while((index = template.indexOf("{{")) > -1){
			var end = template.indexOf("}}", index);
			var key = template.substring(index + 2, end);
			if(data.hasOwnProperty(key)){
				template = template.substring(0, index) + data[key] + template.substring(end+2);
			}
			else {
				template = template.substring(0, index) + template.substring(end+2);
			}
		}
		
		return template;
	}
	
	function parseRouteData(data){
		var separator = "";
		if(data.indexOf("\n\r") > -1){
			separator = "\n\r";
		}
		else if(data.indexOf("\r\n") > -1){
			separator = "\r\n";
		}
		else if(data.indexOf("\r") > -1){
			separator = "\r";
		}
		else {
			separator = "\n";
		}
		var lines = data.split(separator);
		
		var obj = {};
		var lastProp;
		for(var i=0;i<lines.length;i++){
			if(lines[i].indexOf(":") == -1){
				if(lastProp != undefined){
					obj[lastProp] = obj[lastProp] + lines[i].trim();
				}
				continue;
			}
			
			var parts = lines[i].split(":");
			var key = parts[0].replace("*", "").replace("\t", "").trim();
			var val = parts[1].trim();
			obj[key] = val;
			lastProp = key;
		}
		
		return obj;
	}
});