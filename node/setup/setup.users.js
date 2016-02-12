var fs = require("fs");
module.exports = (function(app, logger){
	app.get("/setup/users", function(req, res){
		fs.readFile("./html/html/setup.users.html", "utf8", function(err, htmlFile){
			
		});
	});
	
	app.get("/setup/users/check", function(req, res){
		fs.readFile("./db/db.config.json", "utf8", function(err, file){
			if(err){
				var message = "Error reading database configuration file. " + err;
				logger.error(message);
				res.send(JSON.stringify({
					status:	"error",
					data:	message
				});
				throw message;
			}
			
			var config = JSON.parse(file);
			var db = require("../db/" + config.driver.substring(0, config.driver.lastIndexOf(".js")))(logger);
			db.get({
				coll:	"users",
				fields:	["FirstName", "LastName", "UserName"],
				query:	{},
				callback:	function(response){
					if(response.status == "error"){
						var message = "Error retrieving user information. " + response.data;
						logger.error(message);
						res.send(JSON.stringify({
							status:	"error",
							data:	message
						});
						throw message;
					}
					
					if(response.metadata.size == 0){
						res.writeHead(302, {
							"Location":	"/setup/users"
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
});