module.exports = function(app, db, sessions){
	var path = "/api/notifications";
	
	/**
	 *	method:	GET
	 *	path:	/api/notifications
	 * 	description: Retrieves the type, note and CreateDate for all notifications where the logged in user is the recipient.
	 *	response:	type, note, CreateDate, read
	 */
	app.get(path, function(req, res){
		db.get({
			coll:		"notifications",
			query:		{recipient: req.userID},
			fields:		["type", "note", "CreateDate", "read"],
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:	GET
	 *	path:	/api/notifications/new
	 *	description: Retrieves a list of notifications that have not yet been read by the logged in user. Only useful for getting a count.
	 *	response:	_id
	 */
	app.get(path + "/new", function(req, res){
		db.get({
			coll:		"notifications",
			query:		{recipient: req.userID, read: false},
			fields:		["_id"],
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	app.param("notificationId", function(req, res, next, id){
		req.notificationId = id;
		next();
	});
	
	/**
	 *	method:	PUT
	 *  path:	/api/notifications/{notificationId}
	 *	description: Used to mark a notification as read.
	 *	data:	notificationId
	 */
	app.put(path + "/:notificationId", function(req, res){
		db.update({
			coll:		"notifications",
			query:		{_id: req.notificationId},
			data:		{read: true},
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
}