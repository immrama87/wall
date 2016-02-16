var fs = require("fs");

module.exports = (function(app, db, sessions, logger){
	app.all("/app", verifyAccess);
	app.all("/app/*", verifyAccess);
	
	app.get("/app", function(req, res){
		var data = {};
		data.objects = "";
		
		if(sessions.verifyPermission(req.userID, "Admin")){
			data.objects += "<li><a href='/app/server'>Server Configuration</a></li>";
			data.objects += "<li><a href='/app/db'>Database Configuration</a></li>";
			data.objects += "<li><a href='/app/walls'>Wall Configuration</a></li>";
			data.objects += "<li><a href='/app/categories'>Category Configuration</a></li>";
			data.objects += "<li><a href='/app/permissions'>Permission Configuration</a></li>";
		}
		
		if(sessions.verifyPermission(req.userID, "UserAdmin")){
			data.objects += "<li><a href='/app/users'>User Configuration</a></li>";
			data.objects += "<li><a href='/app/user-permissions'>User Permissions</a></li>";
		}
		
		data.objects += "<li><a href='/api/help'>API Documentation</a></li>";
		
		fs.readFile("./html/html/app.main.html", "utf8", function(err, file){
			if(err)
				throw err;
			
			res.end(generateHTML(data, file));
		});
	});
	
	app.param("objectId", function(req, res, next, oId){
		req.objectId = oId;
		next();
	});
	
	app.get("/app/:objectId", function(req, res){
		var data = getData(req.objectId);
		
		fs.readFile("./html/html/app." + req.objectId + ".html", "utf8", function(err, file){
			if(err)
				throw err;
				
			res.end(generateHTML(data, file));
		});
	});
	
	function getData(objectId){
		var data = {};
		
		if(objectId == "server"){
			data.status = app.service.status;
		}
		
		return data;
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