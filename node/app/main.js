var fs = require("fs");
var os = require("os");

module.exports = (function(app, db, sessions, logger){
	app.all("/app", verifyAccess);
	app.all("/app/*", verifyAccess);
	
	app.get("/app", function(req, res){
		var data = {};
		data.objects = buildConfigObjects(req.userID);
		
		fs.readFile("./html/html/app.main.html", "utf8", function(err, file){
			if(err)
				throw err;
			
			res.end(generateHTML(data, file));
		});
	});
	
	app.get("/app/status", function(req, res){
		res.end(JSON.stringify({status: app.service.status}));
	});
	
	app.param("logFile", function(req, res, next, logFile){
		req.logFile = logFile;
		next();
	});
	
	app.get("/app/logs/:logFile/Download", function(req, res){
		var fileName = req.logFile;
		var newFile = fileName.substring(0, fileName.indexOf(".log")) + "_" + new Date().getTime() + ".log";
		res.setHeader("Content-Disposition", "attachment; filename=\"" + newFile + "\"");
		
		fs.readFile("./logs/" + req.logFile, "utf8", function(err, file){
			if(err)
				throw err;
			
			res.end(file);
		});
	});
	
	app.get("/app/logs/:logFile", function(req, res){
		console.log(req.logFile);
		fs.readFile("./logs/" + req.logFile, "utf8", function(err, file){
			if(err)
				throw err;
			
			var content = [];
			
			var lines = req.query.lines || 25;
			var fileLines = file.split("\r");
			var total = fileLines.length;
			
			while(content.length < lines && fileLines.length > 0){
				var line = fileLines.pop();
				if(line.trim() != ""){
					content.push(line);
				}
				else {
					total--;
				}
			}
			
			res.end(JSON.stringify({lines: lines, data: content, total: total}));
		});
	});
	
	app.param("objectId", function(req, res, next, oId){
		req.objectId = oId;
		next();
	});
	
	app.get("/app/:objectId", function(req, res){
		var data = getData(req.objectId, function(data){
			data.objects = buildConfigObjects(req.userID);
			data.object = req.objectId;
			
			fs.readFile("./html/html/app.snippet.html", "utf8", function(err, snippet){
				if(err)
					throw err;
					
				fs.readFile("./html/html/app." + req.objectId + ".html", "utf8", function(err, file){
					if(err)
						throw err;
						
						
					data.content = generateHTML(data, file);
					res.end(generateHTML(data, snippet));
				});
			});
		});
	});
	
	function buildConfigObjects(userId){
		var objs = "";
		
		if(sessions.verifyPermission(userId, "Admin")){
			objs += "<li><a href='/app/server'>Server Configuration</a></li>";
			objs += "<li><a href='/app/db'>Database Configuration</a></li>";
			objs += "<li><a href='/app/walls'>Wall Configuration</a></li>";
			objs += "<li><a href='/app/categories'>Category Configuration</a></li>";
			objs += "<li><a href='/app/permissions'>Permission Configuration</a></li>";
		}
		
		if(sessions.verifyPermission(userId, "UserAdmin")){
			objs += "<li><a href='/app/users'>User Configuration</a></li>";
			objs += "<li><a href='/app/user-permissions'>User Permissions</a></li>";
		}
		
		objs += "<li><a href='/api/help'>API Documentation</a></li>";
		
		return objs;
	}
	
	function getData(objectId, callback){
		var data = {};
		
		if(objectId == "server"){
			data.Object = "Server";
			data.status = app.service.status;
			fs.readdir("./logs", function(err, dirFiles){
				data.logs = "";
				if(!err){
					for(var i=0;i<dirFiles.length;i++){
						data.logs += "<li><a file-link='" + dirFiles[i] + "' href='javascript:void(0);'>" + dirFiles[i] + "</a></li>";
					}
				}
				
				callback(data);
			});
		}
		else if(objectId == "db"){
			data.Object = "Database";
			try{
				var existing = fs.readFileSync("./db/db.config.json", "utf8");
				data.existing = existing.replace(new RegExp("\"", 'g'), "'");
			}
			catch(err){}
			
			fs.readdir("./db", function(dbDirErr, dbFiles){
				if(dbDirErr)
					throw dbDirErr;
				
				data.driverRows = "";
				for(var i=0;i<dbFiles.length;i++){
					if(dbFiles[i].substring(dbFiles[i].lastIndexOf(".")) == ".js"){
						try{
							var driver = require("../db/" + dbFiles[i].substring(0, dbFiles[i].lastIndexOf(".js")))(logger);
							var driver_details = driver.details;
							
							data.driverRows += "<tr id='" + dbFiles[i] + "' props='" + JSON.stringify(driver_details.properties) + "'>";
							data.driverRows += "<td class='driver'>" + dbFiles[i] + "</td>";
							data.driverRows += "<td>" + driver_details.description + "</td>";
							data.driverRows += "<td><i class='fa fa-check-circle'></i></td>";
							data.driverRows += "</tr>";
						}
						catch(err){
							console.log(err);
							data.driverRows += "<tr class='error' props='' selectable='false'>"
							data.driverRows += "<td>" + dbFiles[i] + "</td>";
							data.driverRows += "<td>Could not read driver configuration. Contact the driver developer to use this driver.</td>";
							data.driverRows += "<td></td>";
							data.driverRows += "</tr>";
						}
					}
				}
				callback(data);
			});
		}
		else if(objectId == "walls"){
			data.Object = "Walls";
			callback(data);
		}
	}
	
	function verifyAccess(req, res, next){
		if(req.status != "unverified"){
			if(sessions.verifyPermission(req.userID, "Admin") || sessions.verifyPermission(req.userID, "UserAdmin")){
				next();
			}
			else {
				fs.readFile("./html/errors/403.html", "utf8", function(err, file){
					if(err)
						throw err;
					
					data = {};
					data.route = req.url;
					res.status(403).end(generateHTML(data, file));
				});
			}
		}
		else {
			fs.readFile("./html/html/login.html", "utf8", function(err, file){
				if(err)
					throw err;
					
				res.end(file);
			});
		}
	}
	
	function generateHTML(content, file){
		var index = 0;
		while((index = file.indexOf("{{")) > -1){
			var end = file.indexOf("}}", index);
			var key = file.substring(index+2, end);
			file = file.substring(0, index) + content[key] + file.substring(end+2);
		}
		
		return file;
	}
});