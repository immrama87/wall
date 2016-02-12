var express = require("express");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var logFactory = require("./logger/logger")();
var fs = require("fs");

app.REQUIRED_TABLES = ["categories", "comments", "notes", "users", "walls"];
app.service = {
	status:	"starting"
};

var setup = require("./setup/setup")(app, logFactory.getInstance("Setup", "admin"));

app.initializeRoutes = function(){
	fs.readFile("./db/db.config.json", "utf8", function(err, file){
		if(!err) {
			var dbConfig = JSON.parse(file);
			var db = require("./db/" + dbConfig.driver.substring(0, dbConfig.driver.lastIndexOf(".js")))(logFactory.getInstance("Database", "db"));
			db.config(dbConfig);
			db.startup(app.REQUIRED_TABLES, function(startupErr){
				if(startupErr){
					app.service.status = "stopped";
					logFactory.getInstance("Startup", "error").error("Error starting database. " + startupErr);
				}
				else {
					var sessions = require("./sessions/sessionManager")(db, logFactory.getInstance("SessionManager", "access"));

					app.use("/static", express.static("./html"))

					app.options("/api/help", send403);
					app.options("/setup", send403);

					var accessLog = logFactory.getInstance("server", "access");

					app.options("/api/*", function(req, res){
						accessLog.trace("Cross-Origin Resource Sharing request received from " + req.headers.origin);
						res.status(200);
						res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
						res.setHeader('Access-Control-Allow-Headers','Access-Control-Allow-Origin, Access-Control-Allow-Headers');
						res.setHeader('Access-Control-Allow-Methods','POST, GET, PUT, DELETE');
						res.setHeader('Access-Control-Allow-Credentials','true');
						res.end();
					});


					app.all("*", function(req, res, next){
						res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
						res.setHeader("Access-Control-Allow-Credentials", "true");
						if(req.url == "/api/users/login"){
							next();
						}
						else {
							var id;
							var cookie = req.headers.cookie;
							var response = {};
							var proceed = true;
							if(cookie == undefined){
								if(req.url.indexOf("/api/help") == -1){
									response.status = "unverified";
									proceed = false;
								}
								else {
									req.status = "unverified";
								}
							}
							else {
								id = sessions.getSession(cookie);
							}
						
							if(id == undefined){
								if(req.url.indexOf("/api/help") == -1){
									response.status = "unverified";
									proceed = false;
								}
								else {
									req.status = "unverified";
								}
							} 
							else {
								req.userID = id;
							}
							
							accessLog.trace("Request received for " + req.method + " " + req.url + " from origin " + req.headers.host + " initiated by " + (req.userID || "unknown user") + ".");
							
							if(proceed){
								next();
							}
							else {
								res.send(JSON.stringify(response));
							}
						}
					});

					var users = require("./api/v1.0/users")(app, db, sessions, logFactory.getInstance("/api/users/", "admin"));
					var walls = require("./api/v1.0/walls")(app, db, sessions);
					var notes = require("./api/v1.0/notes")(app, db, sessions);
					var categories = require("./api/v1.0/categories")(app, db, sessions);
					var help = require("./api/v1.0/help")(app, express);
					
					app.service.status = "started";
				}
			});
		}
		else {
			app.service.status = "stopped";
		}
	});
}

var server = app.listen(3000, function(){
	app.initializeRoutes();
	var host = server.address().address;
	var port = server.address().port;
	
	console.log("Listening at http://%s:%s", host, port);
});

function send403(req, res){
	res.status(403).send(JSON.stringify({status: "unverified"}));
}