module.exports = function(app, db, sessions){
	var path = "/api/walls/:wallId/categories/";
	
	/**
	 *	method:	GET
	 *	path:	/api/walls/{wallId}/categories/
	 *	description:	Used to retrieve all of the categories configured for a given wall
	 *	data:	wallId
	 *	response:	Color, Name
	 */
	app.get(path, function(req, res){
		db.get({
			coll:		"categories",
			query:		{WallID: req.wallId},
			fields:		["Color", "Name"],
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	/**
	 *	method:	POST
	 *	path:	/api/walls/{wallId}/categories/
	 *	description:	Used to create a new category configuration for a given wall
	 *	data:	wallId, Name, Color
	 *	route:	unsubmittable
	 */
	app.post(path, function(req, res){
		var obj = req.body;
		db.get({
			coll:		"categories",
			query:		{$or:[{WallID: req.wallId, Color: obj.Color}, {WallID: req.wallId, Name: obj.Name}]},
			fields:		["Color", "Name"],
			callback:	function(get){
				if(get.metadata.size > 0){
					var matches = [];
					for(var i=0;i<get.metadata.size;i++){
						if(get.records[i].Name == obj.Name && matches.indexOf("Name") == -1){
							matches.push("Name");
						}
						if(get.records[i].Color == obj.Color && matches.indexOf("Color") == -1){
							matches.push("Color");
						}
						
						response = {
							status:	"error",
							data:	"A category already exists with a matching " + matches.join(" and ") + " value for this wall."
						};
						
						res.send(JSON.stringify(response));
					}
				}
				else {
					obj.CreatedBy = req.userID;
					obj.ModifiedBy = req.userID;
					obj.WallID = req.wallId;
					
					db.post({
						required:	["WallID", "Color", "Name"],
						coll:		"categories",
						data:		obj,
						callback:	function(response){
							res.send(JSON.stringify(response));
						}
					});
				}
			}
		});
	});
	
	app.param("catId", function(req, res, next, catId){
		req.catId = catId;
		next();
	});
	
	/**
	 *	method:	GET
	 *	path:	/api/walls/{wallId}/categories/{catId}/
	 *	description:	Used to retrieve the details of a given category for a given wall
	 *	data:	wallId, catId
	 *	response:	Color, Name
	 */
	app.get(path + ":catId", function(req, res){
		db.get({
			coll:		"categories",
			query:		{_id:	req.catId},
			fields:		["Color", "Name"],
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:	PUT
	 *	path:	/api/walls/{wallId}/categories/{catId}/
	 *	description:	Used to update the configuration of a given category for a given wall
	 *	data:	wallId, catId, Name--optional, Color--optional
	 */
	app.put(path + ":catId", function(req, res){
		db.update({
			coll:		"categories",
			query:		{_id:	req.catId},
			data:		req.body,
			callback:	function(response){
				res.send(JSON.stringify(response));
			}
		});
	});
	
	/**
	 *	method:	DELETE
	 *	path:	/api/walls/{wallId}/categories/{catId}/
	 *	description:	Used to delete a given category from a given wall.
	 *	data:	wallId, catId
	 *	route:	unsubmittable
	 */
	app.delete(path + ":catId", function(req, res){
		db.get({
			coll:		"categories",
			query:		{WallID: req.wallId},
			fields:		[],
			callback:	function(get){
				if(get.metadata.size > 1){
					db.delete({
						coll:		"categories",
						query:		{_id:	req.catId},
						callback:	function(response){
							res.send(JSON.stringify(response));
						}
					});
				}
				else {
					var response = {
						status:	"error",
						data:	"You cannot delete the last category on a Wall."
					};
					
					res.send(JSON.stringify(response));
				}
			}
		});
	});
}