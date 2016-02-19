var express = require("express");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var logFactory = require("./logger/logger")();
var serviceLog = logFactory.getInstance("Server", "admin");
var fs = require("fs");

app.REQUIRED_TABLES = ["categories", "comments", "notes", "users", "walls"];

app.service = {};
app.service.sockets = {};
app.service.nextId = 0;
app.service.status = "starting";

app.all("*", function(req, res, next){
	res.set("Connection", "close");
	next();
});

app.use("/static", express.static("./html"));
var setup = require("./setup/setup")(app, logFactory.getInstance("Setup", "admin"));

function initializeRoutes(){
	fs.readFile("./db/db.config.json", "utf8", function(err, file){
		if(!err) {
			var dbConfig = JSON.parse(file);
			var db = require("./db/" + dbConfig.driver.substring(0, dbConfig.driver.lastIndexOf(".js")))(logFactory.getInstance("Database", "db"));
			db.config(dbConfig);
			db.startup(app.REQUIRED_TABLES, function(startupErr){
				if(startupErr){
					logFactory.getInstance("Startup", "error").error("Error starting database. " + startupErr);
				}
				else {
					var sessions = require("./sessions/sessionManager")(db, logFactory.getInstance("SessionManager", "access"));

					app.options("/api/help/*", send403);
					app.options("/setup/*", send403);
					app.options("/app/*", send403);

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
								if(req.url.indexOf("/api/help") == -1 && req.url.indexOf("/app") == -1){
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
								res.setHeader("Set-Cookie", "NSESSIONID=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT");
								if(req.url.indexOf("/api/help") == -1 && req.url.indexOf("/app") == -1){
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
								res.end(JSON.stringify(response));
							}
						}
					});
					
					var config = require("./app/main")(app, db, sessions, logFactory.getInstance("app", "admin"));
					var users = require("./api/v1.0/users")(app, db, sessions, logFactory.getInstance("/api/users/", "admin"));
					var walls = require("./api/v1.0/walls")(app, db, sessions);
					var notes = require("./api/v1.0/notes")(app, db, sessions);
					var categories = require("./api/v1.0/categories")(app, db, sessions);
					var help = require("./api/v1.0/help")(app, express);
					
					app.post("/app/restartService", function(req, res){
						res.end(JSON.stringify({status: "success", data: "Call received to restart server"}));
						if(app.service.status != "stopped"){
							restartServer(res);
						}
					});
				}
			});
		}
	});
}

var server;

function startServer(){
	app.service.status = "starting";
	app.service.sockets = {};
	app.service.nextId = 0;
	server = app.listen(3000, function(){
		initializeRoutes();
		var host = server.address().address;
		var port = server.address().port;
		
		serviceLog.info("Server at http://%s:%d started.", host, port);
		app.service.status = "started";
	});
	
	server.on("connection", function(socket){
		var socketId = app.service.nextId++;
		app.service.sockets[socketId] = socket;
		
		socket.on("close", function(){
			delete app.service.sockets[socketId];
		});
	});
}

function restartServer(){
	server.close(function(){
		serviceLog.info("Closed remaining connections and stopped server.");
	});

	for(var socketId in app.service.sockets){
		app.service.sockets[socketId].destroy();
	}
	
	startServer();
}

startServer();

app.reinitialize = function(){
	restartServer();
}

function send403(req, res){
	res.status(403).end(JSON.stringify({status: "unverified"}));
}