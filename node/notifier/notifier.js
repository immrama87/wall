module.exports = function(io, db, sessions){
	var n = {};
	
	var users = {};

	io.on("connection", function(socket){
		var userId = sessions.getSession(socket.handshake.headers.cookie);
		users[userId] = socket.id;
		
		db.get({
			coll:		'users',
			query:		{UserName: userId},
			fields:		["FirstName", "LastName"],
			callback:	function(data){
				if(data.status == "success"){
					if(data.records.length > 0){
						socket.broadcast.emit("new-user", {
							UserName:	userId,
							FirstName:	data.records[0].FirstName,
							LastName:	data.records[0].LastName
						});
					}
				}
			}
		});
		
		socket.on("users", function(){
			var response = [];
			
			db.get({
				coll:		'users',
				query:		{},
				fields:		["FirstName", "LastName", "UserName"],
				callback:	function(data){
					if(data.status == "success"){
						var userIndex = -1;
						for(var i=0;i<data.records.length;i++){
							if(data.records[i].UserName == userId){
								userIndex = i;
							}
							data.records[i].active = users.hasOwnProperty(data.records[i].UserName);
						}
						
						if(userIndex > -1){
							data.records.splice(userIndex, 1);
						}
						io.to(socket.id).emit("user-list", data.records);
					}
				}
			});
		});
		
		socket.on("rooms", function(){
			var rooms = [];
			db.get({
				coll:		'walls',
				query:		{UserAccessList: userId},
				fields:		["Name"],
				callback:	function(data){
					if(data.status == "success"){
						for(var i=0;i<data.records.length;i++){
							data.records[i].type = "wall";
							socket.join(data.records[i]["_id"]);
							rooms.push(data.records[i]);
						}
						
						db.get({
							coll:		'chat-rooms',
							query:		{Users:	userId},
							fields:		["Name", "Users"],
							callback:	function(roomsData){
								if(roomsData.status == "success"){
									for(var i=0;i<roomsData.records.length;i++){
										roomsData.records[i].type = "custom";
										socket.join(roomsData.records[i]["_id"]);
										rooms.push(roomsData.records[i]);
									}
									
									io.to(socket.id).emit("room-list", rooms);
								}
							}
						});
					}
				}
			});
		});
		
		socket.on("recent-chats", function(){
			db.distinct({
				coll:		'chat',
				field:		'to',
				query:		{from:	userId},
				callback:	function(data){
					if(data.status == "success"){
						var chats = [];
						var requests = 0;
						for(var i=0;i<data.items.length;i++){
							requests++;
							db.get({
								coll:		'chat',
								query:		{from: userId, to: data.items[i]},
								fields:		["when", "to", "type"],
								options:	{
									sort:	[["when", "descending"]],
									limit:	1
								},
								callback:	function(chatResponse){
									if(chatResponse.status == "success"){
										if(chatResponse.records[0].type == "pvt"){
											db.get({
												coll:		'users',
												query:		{UserName:	chatResponse.records[0].to},
												fields:		["UserName", "FirstName", "LastName"],
												callback:	function(userResponse){
													if(userResponse.status == "success" && userResponse.records.length > 0){
														chats.push({
															to: {
																type: 		'user',
																UserName: 	userResponse.records[0].UserName, 
																FirstName:	userResponse.records[0].FirstName,
																LastName:	userResponse.records[0].LastName
															},
															when: chatResponse.records[0].when
														});
													}
													requests--;
												
													if(requests <= 0){
														completeRequest(chats);
													}
												}
											});
										}
										else if(chatResponse.records[0].type == "room"){
											if(chatResponse.records[0].wall){
												db.get({
													coll:		'walls',
													query:		{_id: chatResponse.records[0].to},
													fields:		["Name"],
													callback:	function(wallResponse){
														if(wallResponse.status == "success" && wallResponse.records.length > 0){
															chats.push({
																to:	{
																	type:	'wall',
																	Name:	wallResponse.records[0].Name,
																	_id:	chatResponse.records[0].to
																},
																when:	chatResponse.records[0].when
															});
														}
														requests--;
														
														if(requests <= 0){
															completeRequest(chats);
														}
													}
												});
											}
											else {
												requests--;
												if(requests <= 0){
													completeRequest(chats);
												}
											}
										}
										else {
											requests--;
											if(requests <= 0){
												completeRequest(chats);
											}
										}
									}
								}
							});
						}
					}
				}
			});
			
			function completeRequest(chats){
				if(chats.length > 10){
					chats.sort(function(a, b){
						if(a.when > b.when){
							return 1;
						}
						else if(a.when < b.when){
							return -1;
						}
						else {
							return 0;
						}
					});
					
					chats = chats.slice(0,11);
				}
				
				io.to(socket.id).emit("recent-chats", chats);
			}
		});
		
		socket.on("pvt-message", function(msg){
			db.post({
				coll:	'chat',
				data:	{
					from:		userId,
					to:			msg.to,
					message:	msg.message.trim(),
					when:		msg.when,
					type:		"pvt"
				},
				callback:	function(data){
					if(data.status == "success"){
						if(users.hasOwnProperty(msg.to)){
							io.to(users[msg.to]).emit("pvt-message", {from: userId, message: msg.message.trim(), when: msg.when});
						}
					}
				}
			});
		});
		
		socket.on("room-message", function(msg){
			db.get({
				coll:		'walls',
				query:		{_id: msg.to},
				fields:		[],
				callback: 	function(data){
					if(data.status == "success"){
						db.post({
							coll:	'chat',
							data:	{
								from:		userId,
								to:			msg.to,
								message:	msg.message.trim(),
								when:		msg.when,
								type:		"room",
								wall:		data.records.length > 0
							},
							callback:	function(post){
								if(post.status == "success"){
									socket.broadcast.to(msg.to).emit("room-message", {from: userId, to: msg.to, message: msg.message.trim(), when: msg.when});
								}
							}
						});
					}
				}
			});
		});
		
		socket.on("room-history", function(msg){
			db.get({
				coll:		'chat',
				query:		{to: msg.id},
				fields:		["when", "message", "from"],
				callback:	function(data){
					if(data.status == "success"){
						for(var i=0;i<data.records.length;i++){
							if(data.records[i].from == userId){
								delete data.records[i].from;
							}
						}
						
						var response = {
							to:		msg.id,
							messages:	data.records
						};
						io.to(socket.id).emit("room-history", response);
					}
				}
			});
		});
		
		socket.on("pvt-history", function(msg){
			var now = new Date().getTime();
			var when;
			var end;
			
			if(msg.end){
				end = msg.end - (24*60*60*1000);
				when = {$gte: end, $lte: msg.end};
			}
			else {
				end = now - (24*60*60*1000);
				when = {$gte: end};
			}
			
			db.get({
				coll:		'chat',
				query:		{$or: [{from: userId, to: msg.user}, {from: msg.user, to: userId}], when: when},
				fields:		["when", "message", "from", "to"],
				callback:	function(data){
					if(data.status == "success"){
						data.records.sort(function(a, b){
							if(a.when > b.when){
								return 1;
							}
							else if(a.when < b.when){
								return -1;
							}
							else {
								return 0;
							}
						});
						
						response = {
							user: 		msg.user,
							messages:	data.records
						};
						
						db.get({
							coll:	'chat',
							query:	{$or: [{from: userId, to: msg.user}, {from: msg.user, to: userId}], when: {$lte: end}},
							fields:	["_id"],
							callback:	function(earlier){
								if(earlier.status == "success"){
									if(earlier.records.length > 0){
										response.earlier = true;
										response.nextEnd = end;
									}
								}
								
								io.to(socket.id).emit("pvt-history", response);
							}
						});
					}
				}
			});
		});
		
		socket.on("typing", function(msg){
			if(users.hasOwnProperty(msg.to)){
				io.to(users[msg.to]).emit("typing", {from: userId});
			};
		});
		
		socket.on("create-room", function(msg){
			db.get({
				coll:		'chat-rooms',
				query:		{Name: msg},
				fields:		[],
				callback:	function(roomResponse){
					if(roomResponse.status == "success"){
						if(roomResponse.records.length > 0){
							io.to(socket.id).emit("create-room", {status: "error", message: "A chat room with the name " + msg + " already exists."});
						}
						else {
							db.post({
								coll:		'chat-rooms',
								data:		{Name: msg, Users: [userId]},
								callback:	function(createResponse){
									if(createResponse.status == "success"){
										io.to(socket.id).emit("create-room", {status: "success", Name: msg, id: createResponse.data.insertedIds[0]});
									}
									else {
										io.to(socket.id).emit("error", createResponse);
									}
								}
							});
						}
					}
					else {
						io.to(socket.id).emit("error", roomResponse);
					}
				}
			});
		});
		
		socket.on("room-add-user", function(msg){
			db.get({
				coll:		'chat-rooms',
				query:		{_id: msg.id, Users: msg.user},
				fields:		[],
				callback:	function(lookup){
					if(lookup.status == "success"){
						if(lookup.records.length > 0){
							io.to(socket.id).emit("room-add-user", {status: "error", message: "This user is already a member of this room."});
						}
						else {
							db.addToArray({
								coll:		'chat-rooms',
								query:		{_id: msg.id},
								field:		"Users",
								data:		msg.user,
								callback:	function(userAdd){
									if(userAdd.status == "success"){
										io.to(msg.id).emit("room-add-user", msg);
										if(users.hasOwnProperty(msg.user)){
											io.to(users[msg.user]).emit("room-invite", {
												room: msg.id,
												name: msg.name,
												from: userId
											});
										}
									}
								}
							});
						}
					}
					else {
						io.to(socket.id).emit("error", lookup);
					}
				}
			});
		});
		
		socket.on("disconnect", function(){
			socket.broadcast.emit("dc-user", userId);
			delete users[userId];
		});
	});
	
	n.createNotification = function(user, type, message){
		db.post({
			coll:	"notifications",
			data:	{
				recipient:	user,
				note:		message,
				read:		false,
				type:		type
			},
			required:	[],
			callback:	function(response){
				if(response.status == "success"){
					if(users.hasOwnProperty(user)){
						var noteObj = {
							type:		type,
							message:	message,
							id:			response.data.insertedIds[0]
						};
						io.to(users[user]).emit("new-message", noteObj);
					}
				}
			}
		});
	}
	
	return n;
}