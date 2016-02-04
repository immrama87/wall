module.exports = function(app, db, sessions){
	var path = "/api/walls/:wallId/categories";
	
	app.param("wallId", function(req, res, next, wallId){
		req.wallId = wallId;
		next();
	});
	
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
	
	
}