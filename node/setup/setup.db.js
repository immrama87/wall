var fs = require("fs");

module.exports = (function(app, logger){
	app.get("/setup/db/", function(req, res){
		fs.readFile("./html/html/setup.db.html", "utf8", function(htmlErr, htmlFile){
			if(htmlErr)
				throw htmlErr;
				
			var content = {};
			try{
				var existing = fs.readFileSync("./db/db.config.json", "utf8");
				content.existing = existing.replace(new RegExp("\"", 'g'), "'");
			}
			catch(err){}
			
			fs.readdir("./db", function(dbDirErr, dbFiles){
				if(dbDirErr)
					throw dbDirErr;
				
				content.driverRows = "";
				for(var i=0;i<dbFiles.length;i++){
					if(dbFiles[i].substring(dbFiles[i].lastIndexOf(".")) == ".js"){
						try{
							var driver = require("../db/" + dbFiles[i].substring(0, dbFiles[i].lastIndexOf(".js")))(logger);
							var driver_details = driver.details;
							
							content.driverRows += "<tr id='" + dbFiles[i] + "' props='" + JSON.stringify(driver_details.properties) + "'>";
							content.driverRows += "<td class='driver'>" + dbFiles[i] + "</td>";
							content.driverRows += "<td>" + driver_details.description + "</td>";
							content.driverRows += "<td><i class='fa fa-check-circle'></i></td>";
							content.driverRows += "</tr>";
						}
						catch(err){
							console.log(err);
							content.driverRows += "<tr class='error' props='' selectable='false'>"
							content.driverRows += "<td>" + dbFiles[i] + "</td>";
							content.driverRows += "<td>Could not read driver config file. Ensure " + dbFiles[i] + ".json exists to use this driver.</td>";
							content.driverRows += "<td></td>";
							content.driverRows += "</tr>";
						}
					}
				}
				res.send(generateHTML(content, htmlFile));
			});
		});
	});
	
	app.get("/setup/db/check", function(req, res){
		validateDB(res);
	});
	
	app.post("/setup/db/Test", function(req, res){
		var db = require("../db/" + req.body.driver.substring(0, req.body.driver.lastIndexOf(".js")))(logger);
		db.test(req.body, res);
	});
	
	app.post("/setup/db/Create", function(req, res){
		writeConfig(req.body, res);
	});
	
	app.get("/setup/db/Validate", function(req, res){
		validateConfig(res);
	});
	
	app.put("/setup/db/Initialize", function(req, res){
		initializeDB(req.body.missing, res);
	});
	
	function validateDB(res){
		fs.readFile("./db/db.config.json", "utf8", function(err, file){
			if(err){
				if(err.code == "ENOENT"){
					res.writeHead(302, {
						"Location":	"/setup/db/"
					});
					res.end();
					throw err;
				}
			}
			
			res.writeHead(302, {
				"Location":	"/setup/users/check"
			});
			res.end();
		});
	}
	
	function initializeDB(missing, res){
		fs.readFile("./db/db.config.json", "utf8", function(err, file){
			if(err){
				var message = "";
				if(err.code == "ENOENT"){
					message = "The file db/db.config.json could not be found and was expected for initialization.";
				}
				logger.error(message);
				res.send(JSON.stringify({
					status:	"error",
					data:	message
				}));
				throw message;
			}
			
			var config = JSON.parse(file);
			var db = require("../db/" + config.driver.substring(0, config.driver.lastIndexOf(".js")))(logger);
			db.initialize(config, missing, res);
		});
	}
	
	function validateConfig(res){
		fs.readFile("./db/db.config.json", "utf8", function(err, file){
			if(err){
				var message = "";
				if(err.code == "ENOENT"){
					message = "The file db/db.config.json could not be found and was expected for validation.";
				}
				logger.error(message);
				res.send(JSON.stringify({
					status:	"error",
					data:	message
				}));
				throw message;
			}
			
			var config = JSON.parse(file);
			var db = require("../db/" + config.driver.substring(0, config.driver.lastIndexOf(".js")))(logger);
			db.validate(config, res, app.REQUIRED_TABLES);
		});
	}
	
	function generateHTML(data, template){
		var index = 0;
		while((index = template.indexOf("{{")) > -1){
			var end = template.indexOf("}}", index);
			var key = template.substring(index+2, end);
			
			var value = data[key] || "";
			template = template.substring(0, index) + value + template.substring(end+2);
		}
		
		return template;
	}
	
	function writeConfig(config, res){
		var db = require("../db/" + config.driver.substring(0, config.driver.lastIndexOf(".js")))(logger);
		var data = db.generateConfigObject(config);
		data.driver = config.driver;
		fs.writeFile("./db/db.config.json", JSON.stringify(data), {
			"encoding":	"utf8",
			"flag":	"w"
		}, function(err){
			if(err){
				var message = "Error occurred writing to DB Config. Error Message: " + err
				logger.error(message);
				res.send(JSON.stringify({
					status:	"error",
					data:	"message"
				}));
				throw message;
			}
			
			res.send(JSON.stringify({
				status:	"success"
			}));
		});
	}
});