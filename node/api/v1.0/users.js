var crypto = require("crypto");

module.exports = function(app, db, sessions, logger){
	var path = "/api/users/";
		
	/**
	 *	method:			GET
	 *	path:			/api/users/
	 *	description: 	Retrieves a list of users on the current server.
	 *	response:		FirstName, LastName, UserName
	 */
	app.get(path, function(req, res){
		db.get({
			coll:		"users",
			fields:		["FirstName", "LastName", "UserName"],
			query:		{},
			callback:	function(data){
				if(data.status == "error"){
					logger.error("Error occurred at endpoint /api/users/.\n\tError Message: " + data.data);
				}
				res.end(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:			POST
	 *	path:			/api/users/
	 *	description:	Adds a new user to the database.
	 *	data:			FirstName, LastName, UserName, Password
	 */
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
					
					res.end(JSON.stringify(response));
				}
				else {
					obj.LastLogin = new Date().getTime();
					obj.CreateDate = new Date().getTime();
					if(obj.hasOwnProperty("Password")){
						obj.Password = encrypt(obj.Password, obj.CreateDate);
					}
					else {
						obj.Password = encrypt(obj.UserName, obj.CreateDate);
						obj.UpdatePassword = true;
					}
					obj.Permissions = ["General"];
					db.post({
						required:	["FirstName", "LastName", "UserName", "Password"],
						coll:		"users",
						data: 		obj,
						callback:	function(response){
							res.end(JSON.stringify(response));
						}
					});
				}
			}
		});
	});
	
	/**
	 *	method:			POST
	 *	path:			/api/users/login/
	 *	description:	Used to authenticate and establish a session to the API
	 *	data:			UserName, Password
	 *	route:			unsubmittable
	 */
	app.post(path + "login/", function(req, res){
		var obj = req.body;
		var response = {};
		db.get({
			coll:		"users",
			fields:		["Password", "CreateDate", "LastLogin", "UpdatePassword"],
			query:		{UserName:	obj.UserName},
			callback:	function(data){
				if(data.status == "error"){
					response = data;
				}
				else if(data.metadata.size == 0){
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
						if(record.UpdatePassword){
							response.message = "Password Update Required";
						}
						res.set("Set-Cookie", "NSESSIONID=" + sessions.addSession(obj.UserName) + ";Path=/;HttpOnly");
						var time = new Date().getTime();
						db.update({
							coll:	"users",
							query:	{UserName:	obj.UserName},
							data:	{LastLogin:	time},
							markUpdate:	false,
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
	
	app.post(path + "logout/", function(req, res){
		res.send(JSON.stringify(sessions.destroySession(req.userID)));
	});
	
	app.param("id", function(req,res,next,id){
		req.id = id
		next();
	});
	
	/**
	 *	method:	GET
	 *	path:	/api/users/{UserName}/
	 *	description: Used to retrieve details about a given user.
	 * 	response: FirstName, LastName, UserName, CreateDate, ModifiedDate, LastLogin
	 *	data:	UserName
	 */
	app.get(path + ":id", function(req, res){
		console.log(req.id);
		db.get({
			coll:		"users",
			fields:		["FirstName", "LastName", "UserName", "CreateDate", "ModifiedDate", "LastLogin"],
			query:		{UserName:	req.id},
			callback:	function(data){
				res.end(JSON.stringify(data));
			}
		});
	});
	
	app.post(path + ":id/*", function(req, res, next){
		if(sessions.verifyPermission(req.userID, "UserAdmin")){
			next();
		}
		else {
			res.end(JSON.stringify({status: "unauthorized"}));
		}
	});
	
	/**
	 *	method:	POST
	 *	path:	/api/users/{UserName}/permissions/
	 *	description:	Used to add a permission to a given user.
	 *	data:	UserName, Permission
	 */
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
				res.end(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:	PUT
	 *	path:	/api/users/{UserName}/
	 *	description: Used to update a given user.
	 *	data:	UserName, FirstName--optional, LastName--optional, Email--optional
	 *	route:	unsubmittable
	 */
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
					res.end(JSON.stringify(response));
				}
				else if(data.metadata.size > 1){
					response.status = "error";
					response.data = "An error occurred. Please contact an administrator.";
					res.end(JSON.stringify(response));
				}
				else {
					db.update({
						coll:		"users",
						query:		{_id:	data.records[0]._id},
						data:		obj,
						callback:	function(response){
							res.end(JSON.stringify(response));
						}
					});
				}
			}
		});
	});
	
	/**
	 *	method:	PUT
	 *	path:	/api/users/{UserName}/password/
	 *	description:	Used to update a given user's password
	 *	data:	UserName, OldPassword, NewPassword
	 *	route:	unsubmittable
	 */
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
					res.end(JSON.stringify(response));
				}
				else if(data.metadata.size > 1){
					response.status = "error";
					response.data = "An error occurred. Please contact an administrator.";
					res.end(JSON.stringify(response));
				}
				else {
					var password = encrypt(obj.OldPassword, data.records[0].CreateDate);
					if(password == data.records[0].Password){
						var update = {
							Password: encrypt(obj.NewPassword, data.records[0].CreateDate),
							UpdatePassword:	false
						};
						db.update({
							coll:		"users",
							query:		{_id:	data.records[0]._id},
							data:		update,
							callback:	function(response){
								res.end(JSON.stringify(response));
							}
						});
					}
					else {
						response.status = "error";
						response.data = "The password provided does not match the password for user " + req.id;
						res.end(JSON.stringify(response));
					}
				}
			}
		});
	});
	
	/**
	 *	method:	DELETE
	 *	path:	/api/users/{UserName}/
	 *	description:	Used to delete a given user
	 *	data:	UserName
	 *	route:	unsubmittable
	 */
	app.delete(path + ":id", function(req, res){
		db.delete({
			coll:		"users",
			query:		{UserName:	req.id},
			callback:	function(response){
				res.end(JSON.stringify(response));
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