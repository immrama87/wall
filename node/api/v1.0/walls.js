module.exports = function(app, db, sessions){
	var path = "/api/walls/";
	
	/**
	 *	method:	GET
	 *	path:	/api/walls/
	 *	description:	Used to retrieve a list of all walls
	 *	response:	Name, Description
	 */
	app.get(path, function(req, res){
		db.get({
			coll:		"walls",
			fields:		["Name", "Description", "_id"],
			query:		{},
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:	POST
	 *	path:	/api/walls/
	 *	description:	Used to create a new wall
	 *	data:	Name
	 */
	app.post(path, function(req, res){
		var obj = req.body;
		db.get({
			coll:		"walls",
			fields:		["Name"],
			query:		{Name: obj.Name},
			callback:	function(data){
				if(data.metadata.size > 0){
					response = {
						status:		"error",
						data:		"A wall with the name " + obj.Name + " already exists."
					};
					res.send(JSON.stringify(response));
				}
				else {
					db.post({
						required:	["Name"],
						coll:		"walls",
						data:		obj,
						callback:	function(data){
							res.send(JSON.stringify(data));
						}
					});
				}
			}
		});
	});
	
	app.param("wallId", function(req, res, next, id){
		req.wallId = id;
		next();
	});
	
	/**
	 *	method:	DELETE
	 *	path:	/api/walls/{wallId}
	 *	description:	Used to delete a given wall
	 *	data:	wallId
	 *	route:	unsubmittable
	 */
	app.delete(path + ":wallId", function(req, res){
		db.delete({
			coll:		"walls",
			query:		{"_id":	req.wallId},
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	/**
	 *	method:	GET
	 *	path:	/api/walls/{wallId}/users
	 *	description:	Retrieves the array of usernames that have access to a given wall
	 *	data:	wallId
	 *	response: UserAccessList
	 */
	app.get(path + ":wallId/users", function(req, res){
		db.get({
			coll:		"walls",
			query:		{"_id":	req.wallId},
			fields:		["UserAccessList"],
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	/**
	 *	method:	POST
	 *	path:	/api/walls/{wallId}/users
	 *	description:	Adds a username to the user access list for a given wall
	 *	data:	wallId, UserName
	 *	route:	unsubmittable
	 */
	app.post(path + ":wallId/users", function(req, res){
		db.addToArray({
			coll:		"walls",
			field:		"UserAccessList",
			query:		{"_id": req.wallId},
			data:		req.body.UserName,
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	app.param("userAccessId", function(req, res, next, userAccessId){
		req.userAccessId = userAccessId;
		next();
	});
	
	/**
	 *	method:	DELETE
	 *	path:	/api/walls/{wallId}/users/{userAccessId}
	 *	description: Removes a given username from the user access list for a given wall
	 *	data:	wallId, userAccessId
	 */
	app.delete(path + ":wallId/users/:userAccessId", function(req, res){
		
	});
}