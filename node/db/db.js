var mongo = require("mongodb");
var MongoClient = mongo.MongoClient;

module.exports = (function(logger){
	var d = {};
	var url;
	
	/**
	 *	db.config
	 *	Configures the connection URL for the db client
	 *
	 *	@param obj:		An object containing the following fields:
	 *						* server:	The server name for the connection
	 *						* port:		The TCP port that Mongo is listening
	 *						* db:		The database to connect to
	 */
	d.config = function(obj){
		url = "mongodb://" + obj.server + ":" + obj.port + "/" + obj.db;
	}
	
	/**
	 *	db.get
	 *	Retrieves data from a specified collection, using a specified query.
	 *	
	 *	@param obj:		An object containing the following fields:
	 *						* coll:		The collection to retrieve data from
	 *						* query:	The find query to execute
	 *						* fields:	An array of field names to return from the object
	 *						* callback: A method to call once a response object has been built.
	 */
	d.get = function(obj){
		var response = {};
		MongoClient.connect(url, function(err, db){
			if(err){
				logger.error("Error connecting to MongoDB.\nError Message: " + err);
				response.status = "error";
				response.data = "An error occurred connecting to MongoDB.\nError Message: " + err;
				obj.callback(response);
			}
			else {
				var coll = db.collection(obj.coll);
				
				var fields = null;
				if(obj.fields.indexOf("all") == -1){
					fields = {};
					for(var i=0;i<obj.fields.length;i++){
						fields[obj.fields[i]] = 1;
					}
				}
				
				if(obj.query.hasOwnProperty("_id")){
					obj.query["_id"] = new mongo.ObjectID(obj.query["_id"]);
				}
				
				coll.find(obj.query, fields).toArray(function(err, items){
					if(err){
						response.status = "error";
						response.data = "An error occurred retrieving data from MongoDB.\nError Message: " + err;
					}
					else {
						response.status = "success";
						response.metadata = {};
						response.metadata.size = items.length;
						response.metadata.fields = obj.fields;
						
						response.records = items;
					}
					
					obj.callback(response);
				});
			}
		});
	}
	
	d.post = function(obj){
		var missing = [];
		var response = {};
		for(var i=0;i<obj.required.length;i++){
			if(!obj.data.hasOwnProperty(obj.required[i])){
				missing.push(obj.required[i]);
			}
			else if(obj.data[obj.required[i]] == ""){
				missing.push(obj.required[i]);
			}
		}
		
		if(missing.length > 0){
			var missing_str = missing.join(", ");
			
			response.status = "error";
			response.data = "Required fields not set.\nMissing Fields: " + missing_str;
			obj.callback(response);
		}
		else {
			MongoClient.connect(url, function(err, db){
				if(err){
					response.status = "error";
					response.data = "An error occurred connecting to MongoDB.\nError Message: " + err;
					obj.callback(response);
				}
				else {
					if(!obj.data.hasOwnProperty("CreateDate")){
						obj.data.CreateDate = new Date().getTime();
					}
					if(!obj.data.hasOwnProperty("ModifiedDate")){
						obj.data.ModifiedDate = new Date().getTime();
					}
					
					var coll = db.collection(obj.coll);
					coll.insert(obj.data, function(err, result){
						if(err){
							response.status = "error";
							response.data = "An error occurred while inserting data.\nError Message: " + err;
						}
						else {
							response.status = "success";
							response.data = result;
						}
						
						obj.callback(response);
					});
				}
			});
		}
	}
	
	d.update = function(obj){
		var response = {};
		MongoClient.connect(url, function(err, db){
			if(err){
				response.status = "error";
				response.data = "An error occurred connecting to MongoDB.\nError Message: " + err;
				obj.callback(response);
			}
			else {
				var coll = db.collection(obj.coll);
				if(obj.query.hasOwnProperty("_id")){
					obj.query["_id"] = new mongo.ObjectID(obj.query["_id"]);
				}
				
				obj.data.ModifiedDate = new Date().getTime();
				
				coll.update(obj.query, {$set:obj.data}, function(err, result){
					if(err){
						response.status = "error";
						response.data = "An error occurred while inserting data.\nError Message: " + err;
					}
					else {
						response.status = "success";
						response.data = result;
					}
					
					obj.callback(response);
				});
			}
		});
	}
	
	d.addToArray = function(obj){
		var response = {};
		MongoClient.connect(url, function(err, db){
			if(err){
				response.status = "error";
				response.data = "An error occurred connecting to MongoDB.\nError Message: " + err;
				obj.callback(response);
			}
			else {
				var coll = db.collection(obj.coll);
				var fields = {};
				fields[obj.field] = 1;
				fields["_id"] = 1;
				
				sanitizeQuery(obj.query);
				
				coll.find(obj.query, fields).toArray(function(err, items){
					if(err){
						response.status = "error";
						response.data = "An error occurred retrieving data for update.\nError Message: " + err;
						obj.callback(response);
					}
					else {
						for(var i=0;i<items.length;i++){
							var data = {}
							data[obj.field] = [];
							if(items[i][obj.field] != undefined){
								data[obj.field] = items[i][obj.field];
							}
							
							if(data[obj.field].indexOf(obj.data) == -1){
								data[obj.field].push(obj.data);
							}
							
							var result = coll.update({_id: items[i]._id}, {$set: data});
							if(result.writeConcernError != undefined){
								response.status = "error";
								response.data = "An error occurred during an update operation.\nError Message: " + result.writeConcernError.errmsg;
								break;
							}
						}
						
						if(!response.status){
							response.status = "success";
							response.numUpdated = items.length;
						}
						obj.callback(response);
					}
				});
			}
		});
	}
	
	d.delete = function(obj){
		var response = {};
		MongoClient.connect(url, function(err, db){
			if(err){
				response.status = "error";
				response.data = "An error occurred connecting to MongoDB.\nError Message: " + err;
				obj.callback(response);
			}
			else {
				var coll = db.collection(obj.coll);
				
				sanitizeQuery(obj.query);
				
				var result = coll.remove(obj.query);
				
				if(result.writeConcernError != undefined){
					response.status = "error";
					response.removed = result.nRemoved;
					response.data = "An error occured while deleting data.\nError Message: " + result.writeConcernError.errmsg;
				}
				else {
					response.status = "success";
					response.removed = result.nRemoved;
				}
				
				obj.callback(response);
			}
		});
	}
	
	function sanitizeQuery(query){
		if(query.hasOwnProperty("_id")){
			query["_id"] = mongo.ObjectID.createFromHexString(query["_id"]);
		}
		
		if(query.hasOwnProperty("$or")){
			for(var i=0;i<query["$or"].length;i++){
				sanitizeQuery(query["$or"][i]);
			}
		}
	}
	
	return d;
});