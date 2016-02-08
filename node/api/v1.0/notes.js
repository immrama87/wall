module.exports = function(app, db, sessions){
	var path = "/api/walls/:wallId/notes/";
	
	app.get(path, function(req, res){
		db.get({
			coll:		"notes",
			query:		{WallID:	req.wallId},
			fields:		["DisplayText"],
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	app.get(path + "new/", function(req, res){
		var loginFieldName = "LastLogin_" + req.wallId;
		db.get({
			coll:		"users",
			query:		{UserName:	req.userID},
			fields:		[loginFieldName],
			callback:	function(user){
				if(user.metadata.size != 1){
					res.send(JSON.stringify({"status":	"error"}));
				}
				else {
					var lastLogin;
					if(user.records[0].hasOwnProperty(loginFieldName)){
						lastLogin = user.records[0][loginFieldName];
					}
					else {
						lastLogin = 0;
					}
					db.get({
						coll:		"notes",
						query:		{ModifiedDate: {$gte: lastLogin}, WallID: req.wallId},
						fields:		["DisplayText"],
						callback:	function(response){
							res.send(JSON.stringify(response));
							
							updateData = {};
							updateData[loginFieldName] = new Date().getTime();
							db.update({
								coll:		"users",
								query:		{UserName:	req.userID},
								data:		updateData,
								callback:	function(data){}
							});
						}
					});
				}
			}
		});
	});
	
	app.post(path, function(req, res){
		var obj = req.body;
		obj.WallID = req.wallId;
		obj.CreateDate = new Date().getTime();
		obj.ModifiedDate = new Date().getTime();
		obj.CreatedBy = req.userID;
		obj.ModifiedBy = req.userID;
		
		db.post({
			required:	["DisplayText", "WallID", "CreateDate", "ModifiedDate"],
			coll:		"notes",
			data:		obj,
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	app.param("noteId", function(req, res, next, noteId){
		req.noteId = noteId;
		next();
	});
	
	app.put(path + ":noteId", function(req, res){
		db.get({
			coll:		"notes",
			query:		{WallID:	req.wallId, _id: req.noteId},
			fields:		[],
			callback:	function(get){
				if(get.metadata.size < 1){
					response = {
						"status":	"error",
						"data":		"There was an error updating the note selected. It may not exist anymore."
					};
					
					res.send(JSON.stringify(response));
				}
				else {
					var obj = req.body;
					obj.ModifiedDate = new Date().getTime();
					obj.ModifiedBy = req.userID;
					
					db.update({
						coll: 		"notes",
						query:		{WallID: req.wallId, _id: req.noteId},
						data:		obj,
						callback:	function(response){
							res.send(JSON.stringify(response));
						}
					});
				}
			}	
		});
	});
	
	app.delete(path + ":noteId", function(req, res){
		db.delete({
			coll:		"notes",
			query:		{$or: [{WallID: req.wallId, _id: req.noteId}, {WallID: new RegExp(req.wallId, "i"), parent: req.noteId}]},
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	var userPath = "/api/walls/:wallId/user/notes/";
	
	app.get(userPath, function(req, res){
		db.get({
			coll:		"notes",
			query:		{WallID:	req.wallId + "_" + req.userID},
			fields:		["X", "Y", "Z", "Parent", "ModifiedDate"],
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	app.get(userPath + ":noteId", function(req, res){
		db.get({
			coll:		"notes",
			query:		{WallID:	req.wallId + "_" + req.userID, Parent: req.noteId},
			fields:		["X", "Y", "Z"],
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	app.post(userPath + ":noteId", function(req, res){
		db.get({
			coll:		"notes",
			query:		{WallID:	req.wallId + "_" + req.userID, Parent:	req.noteId},
			fields:		[],
			callback:	function(get){
				if(get.metadata.size > 0){
					response = {
						status:		"error",
						data:		"This note has already been added to this user's wall."
					};
					
					res.send(JSON.stringify(response));
				}
				else {
					var obj = req.body;
					obj.Parent = req.noteId;
					obj.WallID = req.wallId + "_" + req.userID;
					
					db.post({
						required:	["X", "Y", "Parent", "WallID"],
						coll:		"notes",
						data:		obj,
						callback:	function(response){
							res.send(JSON.stringify(response));
						}
					});
				}
			}
		});
	});
	
	app.put(userPath + ":noteId", function(req, res){
		db.get({
			coll:		"notes",
			query:		{WallID:	req.wallId + "_" + req.userID, Parent:	req.noteId},
			fields:		[],
			callback:	function(get){
				if(get.metadata.size < 1){
					response = {
						status:		"error",
						data:		"There was an error updating the current note. It may not exist anymore."
					};
					
					res.send(JSON.stringify(response));
				}
				else {
					var obj = req.body;
					db.update({
						coll:		"notes",
						query:		{WallID: req.wallId + "_" + req.userID, Parent: req.noteId},
						data:		obj,
						callback:	function(response){
							res.send(JSON.stringify(response));
						}
					});
				}
			}
		});
	});
}