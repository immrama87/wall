var crypto = require("crypto");

module.exports = function(app, db, sessions){
	var path = "/api/users/";
	
	app.param("id", function(req,res,next,id){
		req.id = id
		next();
	});
	
	app.get(path, function(req, res){
		db.get({
			coll:		"users",
			fields:		["FirstName", "LastName", "UserName"],
			query:		{},
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	app.get(path + ":id", function(req, res){
		console.log(req.id);
		db.get({
			coll:		"users",
			fields:		["FirstName", "LastName", "UserName", "CreateDate", "ModifiedDate", "LastLogin"],
			query:		{UserName:	req.id},
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	app.post(path, function(req, res){
		var obj = req.body;
		
		db.get({
			coll:		"users",
			fields:		[],
			query:		{"UserName": obj.UserName},
			callback:	function(data){
				if(data.metadata.size > 0){
					response = {
						status:		"error",
						data:		"A user with the username " + obj.UserName + " already exists."
					};
					
					res.send(JSON.stringify(response));
				}
				else {
					obj.LastLogin = new Date().getTime();
					obj.CreateDate = new Date().getTime();
					if(obj.hasOwnProperty("Password")){
						obj.Password = encrypt(obj.Password, obj.CreateDate);
					}
					obj.Permissions = ["General"];
					db.post({
						required:	["FirstName", "LastName", "UserName", "Password"],
						coll:		"users",
						data: 		obj,
						callback:	function(response){
							res.send(JSON.stringify(response));
						}
					});
				}
			}
		});
	});
	
	app.post(path + "login/", function(req, res){
		var obj = req.body;
		var response = {};
		db.get({
			coll:		"users",
			fields:		["Password", "CreateDate", "LastLogin"],
			query:		{UserName:	obj.UserName},
			callback:	function(data){
				if(data.metadata.size == 0){
					response.status = "error";
					response.data = "No user with username " + obj.UserName + " could be found.";
				}
				else if(data.metadata.size > 1){
					response.status = "error";
					response.data = "An error occurred. Please contact an administrator.";
				}
				else {
					var record = data.records[0];
					var pass = encrypt(obj.Password, record.CreateDate);
					if(pass == record.Password){
						response.status = "success";
						res.set("Set-Cookie", "NSESSIONID=" + sessions.addSession(obj.UserName) + ";Path=/api/;HttpOnly");
						var time = new Date().getTime();
						db.update({
							coll:	"users",
							query:	{UserName:	obj.UserName},
							data:	{LastLogin:	time},
							callback:	function(response){}
						});
					}
					else {
						response.status = "error";
						response.data = "The password provided does not match the password for user " + obj.UserName;
					}
				}
				
				res.end(JSON.stringify(response));
			}
		});
	});
	
	app.post(path + ":id/*", function(req, res, next){
		if(sessions.verifyPermission(req.userID, "UserAdmin")){
			next();
		}
		else {
			res.send(JSON.stringify({status: "unauthorized"}));
		}
	});
	
	app.post(path + ":id/permissions", function(req, res){
		var obj = req.body;
		db.addToArray({
			coll:		"users",
			query:		{UserName:	req.id},
			field:		"Permissions",
			data:		obj.Permission,
			callback:	function(data){
				if(data.status != "error"){
					sessions.addPermission(req.id, obj.Permission);
				}
				res.send(JSON.stringify(data));
			}
		});
	});
	
	app.put(path + ":id", function(req, res){
		var obj = req.body;
		var response = {};
		
		db.get({
			coll: 		"users",
			fields:		["_id"],
			query:		{UserName:	req.id},
			callback:	function(data){
				if(data.metadata.size == 0){
					response.status = "error";
					response.data = "No user with username " + req.id + " could be found.";
					res.send(JSON.stringify(response));
				}
				else if(data.metadata.size > 1){
					response.status = "error";
					response.data = "An error occurred. Please contact an administrator.";
					res.send(JSON.stringify(response));
				}
				else {
					db.update({
						coll:		"users",
						query:		{_id:	data.records[0]._id},
						data:		obj,
						callback:	function(response){
							res.send(JSON.stringify(response));
						}
					});
				}
			}
		});
	});
	
	app.put(path + ":id/password/", function(req, res){
		var obj = req.body;
		var response = {};
		
		db.get({
			coll: 		"users",
			fields:		["_id", "Password", "CreateDate"],
			query:		{UserName:	req.id},
			callback:	function(data){
				if(data.metadata.size == 0){
					response.status = "error";
					response.data = "No user with username " + req.id + " could be found.";
					res.send(JSON.stringify(response));
				}
				else if(data.metadata.size > 1){
					response.status = "error";
					response.data = "An error occurred. Please contact an administrator.";
					res.send(JSON.stringify(response));
				}
				else {
					var password = encrypt(obj.OldPassword, data.records[0].CreateDate);
					if(password == data.records[0].Password){
						var update = {Password: encrypt(obj.NewPassword, data.records[0].CreateDate)};
						db.update({
							coll:		"users",
							query:		{_id:	data.records[0]._id},
							data:		update,
							callback:	function(response){
								res.send(JSON.stringify(response));
							}
						});
					}
					else {
						response.status = "error";
						response.data = "The password provided does not match the password for user " + req.id;
						res.send(JSON.stringify(response));
					}
				}
			}
		});
	});
	
	app.delete(path + ":id", function(req, res){
		db.delete({
			coll:		"users",
			query:		{UserName:	req.id},
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	function encrypt(s, salt){
		var hash = crypto.createHash("md5");
		
		var iters = parseInt(salt.toString().substring(salt.toString().length - 6));
		
		for(var i=0;i<iters;i++){
			hash.update(s+salt);
		}
		
		return hash.digest("hex");
	}
};