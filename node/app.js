var express = require("express");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var db = require("./db/db")();
db.config({
	server:	"localhost",
	port:	27017,
	db:		"wall"
});

var sessions = require("./sessions/sessionManager")(db);

app.options("/*", function(req, res){
	res.writeHead(200, {
		'Access-Control-Allow-Origin':	req.headers.origin,
		'Access-Control-Allow-Headers':	'Access-Control-Allow-Origin, Access-Control-Allow-Headers',
		'Access-Control-Allow-Methods':	'POST, GET, PUT, DELETE',
		'Access-Control-Allow-Credentials': 'true'
	});
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
		if(cookie == undefined){
			response.status = "unverified";
			res.end(JSON.stringify(response));
		}
		else {
			id = sessions.getSession(cookie);
		}
	
		if(id == undefined){
			response.status = "unverified";
			res.end(JSON.stringify(response));
		} 
		else {
			req.userID = id;
			next();
		}
	}
});

var users = require("./api/v1.0/users")(app, db, sessions);
var walls = require("./api/v1.0/walls")(app, db, sessions);
var notes = require("./api/v1.0/notes")(app, db, sessions);
var categories = require("./api/v1.0/categories")(app, db, sessions);


var server = app.listen(3000, function(){
	var host = server.address().address;
	var port = server.address().port;
	
	console.log("Listening at http://%s:%s", host, port);
});