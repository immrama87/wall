module.exports = function(app, db, sessions){
	var path = "/api/walls/:wallId/actions";
	
	/**
	 *	method:	GET
	 *	path:	/api/walls/{wallId}/actions
	 *	description:	Retrieves a list of all actions that have been configured for the specified wall.
	 * 	data:	wallId
	 * 	response: ActionKey, Approval, Notification
	 */
	app.get(path, function(req, res){
		db.get({
			coll:		"actions",
			query:		{wallId:	req.wallId},
			fields:		["ActionKey", "Approval", "Notification"],
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:	POST
	 *	path:	/api/walls/{wallId}/actions
	 *	description: Adds a new action to the specified wall
	 *	data:	wallId,ActionKey, Approval, ApprovalType--optional, Notification, NotificationText--optional
	 */
	app.post(path, function(req, res){
		var obj = req.body;
		db.get({
			coll:		"actions",
			query:		{wallId:	req.wallId, ActionKey: obj.ActionKey},
			fields: 	["ActionKey"],
			callback:	function(getData){
				if(getData.metadata.size > 0){
					var response = {
						status:	"error",
						data:	"An action for the key " + obj.ActionKey + " has already been configured."
					};
					res.send(JSON.stringify(response));
				}
				else {
					obj.wallId = req.wallId;
					db.post({
						coll:		"actions",
						required:	["ActionKey", "Approval", "Notification", "wallId"],
						data:		obj,
						callback:	function(data){
							res.send(JSON.stringify(data));
						}
					});
				}
			}
		});
	});
	
	app.param("actionKey", function(req, res, next, key){
		req.actionKey = key;
		next();
	});
	
	/**
	 *	method:	GET
	 * 	path:	/api/walls/{wallId}/actions/{actionKey}
	 *  description: Used to retrieve the details of a specified action for a specified wall
	 *  data:  wallId, actionKey
	 *	response: Approval, ApprovalType, Notification, NotificationText
	 */
	app.get(path + "/:actionKey", function(req, res){
		db.get({
			coll:		"actions",
			query:		{wallId: req.wallId, ActionKey: req.actionKey},
			fields:		["Approval", "ApprovalType", "Notification", "NotificationText"],
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:	PUT
	 *	path:	/api/walls/{wallId}/actions/{actionKey}
	 *	description: Used to update an existing action for the specified wall
	 *  data:  wallId, actionKey
	 */
	app.put(path + "/:actionKey", function(req, res){
		db.update({
			coll:		"actions",
			query:		{wallId: req.wallId, ActionKey:	req.actionKey},
			data: 		req.body,
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
	
	/**
	 *	method:	DELETE
	 *	path:	/api/walls/{wallId}/actions/{actionKey}
	 *  description: Used to delete a specified action from a specified wall
	 *  data:	wallId, actionKey
	 *  route:	unsubmittable
	 */
	app.delete(path + "/:actionKey", function(req, res){
		db.delete({
			coll:		"actions",
			query:		{wallId: req.wallId, ActionKey: req.actionKey},
			callback:	function(data){
				res.send(JSON.stringify(data));
			}
		});
	});
}