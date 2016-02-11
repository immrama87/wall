module.exports = function(db, logger){
	var s = {};
	var sessions = {};
	var permMap = {};
	
	s.addSession = function(id){
		var sessId = guid();
		
		for(var i in sessions){
			if(sessions[i].id == id){
				db.update({
					coll:		"users",
					query:		{UserName:	id},
					data:		{LastLogout: new Date().getTime()},
					callback:	function(data){}
				});
				delete sessions[i];
				logger.info("User " + id + " logged out.");
			}
		}
		
		sessions[sessId] = {
			id:			id,
			expires:	new Date(new Date().getTime() + (30 * 60000)).getTime()
		};
		
		db.get({
			coll: 		"users",
			query:		{UserName:	id},
			fields:		["Permissions"],
			callback:	function(data){
				var perms = data.records[0].Permissions;
				logger.info("User " + id + " logged in. Granted permissions: " + perms.join(", "));
				permMap[id] = perms;
			}
		});
		
		return sessId;
	}
	
	s.getSession = function(cookie){
		var index = cookie.indexOf("NSESSIONID=");
		var sessId;
		if(index > -1){
			var start = index + ("NSESSIONID=").length;
			var end = cookie.indexOf(";", start);
			if(end == -1){
				end = cookie.length;
			}
			
			sessId = cookie.substring(start, end);
		}
	
		session = sessions[sessId];
		var id;
		
		if(session != undefined){
			var now = new Date().getTime();
			if(now < session.expires){
				id = session.id;
				session.expires = new Date(now + (30 * 60000)).getTime();
			}
			else {
				db.update({
					coll:		"users",
					query:		{UserName:	session.id},
					data:		{LastLogout: now},
					callback:	function(data){}
				});
				delete sessions[sessId];
			}
		}
		
		return id;
	}
	
	s.addPermission = function(id, perm){
		if(permMap[id].indexOf(perm) == -1){
			permMap[id].push(perm);
		}
	}
	
	s.verifyPermission = function(id, perm){
		return permMap[id].indexOf(perm) > -1;
	}
	
	function guid(){
		var temp = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
		
		while(temp.indexOf("x") > -1){
			temp = temp.substring(0, temp.indexOf("x")) + (Math.floor(Math.random() * 16)).toString(16) + temp.substring(temp.indexOf("x")+1);
		}
		
		var y = ["8", "9", "a", "b"];
		
		while(temp.indexOf("y") > -1){
			temp = temp.substring(0, temp.indexOf("y")) + y[Math.floor(Math.random() * 4)] + temp.substring(temp.indexOf("y")+1);
		}
		
		return temp;
	}
	
	return s;
}