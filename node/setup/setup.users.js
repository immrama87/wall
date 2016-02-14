var fs = require("fs");
module.exports = (function(app, logger){
	app.get("/setup/users", function(req, res){
		fs.readFile("./html/html/setup.users.html", "utf8", function(err, htmlFile){
			var content = {};
			content.userRows = "";
			
			fs.readFile("./db/db.config.json", "utf8", function(err, config){
				if(err){
					var message = "Error reading database configuration file. " + err;
					logger.error(message);
					res.send(JSON.stringify({
						status: "error",
						data:	message
					}));
					throw message;
				}
				
				var dbConfig = JSON.parse(config);
				var db = require("../db/" + dbConfig.driver.substring(0, dbConfig.driver.lastIndexOf(".js")))(logger);
				db.config(dbConfig);
				db.get({
					coll:		"users",
					fields:		["FirstName", "LastName", "UserName", "Email"],
					query:		{},
					callback:	function(response){
						if(response.status == "error"){
							var message = "Error retrieving user information. " + response.data;
							logger.error(message);
							res.send(JSON.stringify({
								status:	"error",
								data:	message
							}));
							throw message;
						}
						
						for(var i=0;i<response.metadata.size;i++){
							content.userRows += "<tr id='" + response.records[i]["UserName"] + "' data='" + JSON.stringify(response.records[i]) + "'>";
							content.userRows += "<td>" + response.records[i]["FirstName"] + " " + response.records[i]["LastName"] + "</td>";
							content.userRows += "<td>" + response.records[i]["UserName"] + "</td>";
							content.userRows += "<td>" + response.records[i]["Email"] + "</td>";
							content.userRows += "</tr>";
						}
						
						res.send(generateHTML(content, htmlFile));
					}
				});
			});
			
		});
	});
	
	app.get("/setup/users/first", function(req, res){
		fs.readFile("./db/db.config.json", "utf8", function(err, file){
			if(err){
				var message = "Error reading database configuration file. " + err;
				logger.error(message);
				res.send(JSON.stringify({
					status:	"error",
					data:	message
				}));
				throw message;
			}
			
			var config = JSON.parse(file);
			var db = require("../db/" + config.driver.substring(0, config.driver.lastIndexOf(".js")))(logger);
			db.config(config);
			db.get({
				coll:	"users",
				fields:	[],
				query:	{},
				callback:	function(response){
					if(response.status == "error"){
						var message = "Error retrieving user information. " + response.data;
						logger.error(message);
						res.send(JSON.stringify({
							status:	"error",
							data:	message
						}));
						throw message;
					}
					
					var content = {};
					content.form = "";
					if(response.metadata.size == 0){
						content.form += createPropField("First Name", "FirstName");
						content.form += createPropField("Last Name", "LastName");
						content.form += createPropField("Username", "UserName");
						content.form += createPropField("Email Address", "Email");
						content.form += createPropField("Password", "Password", {password: true});
						content.form += createPropField("Confirm Password", "", {password: true, ignore: true});
						content.form += "<button id='save'>Create User</button>";
					}
					else {
						content.form = "<p class='error'>A user already exists in the database. This page is only for use during first-time setup.</p>";
						content.form += "<p>To configure users in an existing database, please:</p>";
						content.form += "<ul>";
						content.form += "<li>Navigate to /setup.</li>";
						content.form += "<li>Login if necessary</li>";
						content.form += "<li>Click on the Users object</li>";
					}
					
					fs.readFile("./html/html/setup.users.first.html", "utf8", function(htmlErr, htmlFile){
						if(htmlErr){
							var message = "Error retrieving HTML file. " + htmlErr;
							logger.error(message);
							throw message;
						}
						
						res.send(generateHTML(content, htmlFile));
					});
				}
			});
		});
	});
	
	function createPropField(label, id, options){
		options = options || {};
		
		var field = "<div class='prop-field'>";
		field += "<div class='prop-label'>" + label + "</div>";
		field += "<div class='prop-value'><input id='" + id + "' type='" + ((options.password) ? "password" : "text") + "' ignore='" + ((options.ignore) ? "true" : "false") + "'/></div>";
		field += "</div>";
		return field;
	}
	
	app.get("/setup/users/check", function(req, res){
		fs.readFile("./db/db.config.json", "utf8", function(err, file){
			if(err){
				var message = "Error reading database configuration file. " + err;
				logger.error(message);
				res.send(JSON.stringify({
					status:	"error",
					data:	message
				}));
				throw message;
			}
			
			var config = JSON.parse(file);
			var db = require("../db/" + config.driver.substring(0, config.driver.lastIndexOf(".js")))(logger);
			db.config(config);
			db.get({
				coll:	"users",
				fields:	[],
				query:	{},
				callback:	function(response){
					if(response.status == "error"){
						var message = "Error retrieving user information. " + response.data;
						logger.error(message);
						res.send(JSON.stringify({
							status:	"error",
							data:	message
						}));
						throw message;
					}
					
					if(response.metadata.size == 0){
						res.writeHead(302, {
							"Location":	"/setup/users/first"
						});
						res.end();
					}
					else {
						res.writeHead(302, {
							"Location":	"/app"
						});
						res.end();
					}
				}
			});
		});
	});
	
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
});