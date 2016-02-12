var fs = require("fs");

module.exports = (function(app, logger){
	app.get("/setup", function(req, res){
		res.writeHead(302, {
			"Location":	"/setup/db/check"
		});
		res.end();
	});
	
	require("./setup.db")(app, logger);
	require("./setup.users")(app, logger);
});