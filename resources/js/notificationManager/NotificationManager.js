define("notificationManager/NotificationManager", ["notificationManager/ChatRoom"], function(ChatRoom){
	var nm = {};
	
	var sockets = {};
	var notifications = document.getElementById("notifications");
	var chat = document.getElementById("chat");
	var chatrooms = document.getElementById("chat-rooms");
	var openChatRooms = {};
	
	nm.startSocket = function(url){
		var socket = io.connect(url);
		socket.activeUserList = [];
		sockets[url] = socket;
		socket.emit("users", "");
		socket.emit("rooms", "");
		socket.emit("recent-chats", "");
		
		$(chat).find("#add-room").on("click touch", function(evt){
			WindowManager.loadModal("addChatRoom", {
				getDetails:	function(){
					return {
						url:	url,
						socket:	socket
					};
				}
			});
		});
		
		socket.on("user-list", function(msg){
			for(var i=0;i<msg.length;i++){
				if(msg[i].active){
					socket.activeUserList.push(msg[i]);
				}
				addUserChatLink(msg[i], url, "#chat-people");
			}
		});
		
		socket.on("room-list", function(msg){
			for(var i=0;i<msg.length;i++){
				addRoomChatLink(msg[i], url, "#chat-room-list");
			}
		});
		
		socket.on("recent-chats", function(msg){
			for(var i=0;i<msg.length;i++){
				if(msg[i].to.type == "user"){
					addUserChatLink(msg[i].to, url, "#chat-recent");
				}
				else if(msg[i].to.type == "room" || msg[i].to.type == "wall"){
					addRoomChatLink(msg[i].to, url, "#chat-recent");
				}
			}
		});		
		
		socket.on("new-user", function(msg){
			socket.activeUserList.push(msg);
			
			if(openChatRooms.hasOwnProperty(msg.UserName)){
				openChatRooms[msg.UserName].setOnline();
			}
			
			if($(chat).find("#chat-people li[user='" + msg.UserName + "']").length > 0){
				$(chat).find("#chat-people li[user='" + msg.UserName + "'] div.status").addClass("active");
			}
			if($(chat).find("#chat-recent li[user='" + msg.UserName + "']").length > 0){
				$(chat).find("#chat-recent li[user='" + msg.UserName + "'] div.status").addClass("active");
			}
		});
		
		socket.on("dc-user", function(msg){
			if(openChatRooms.hasOwnProperty(msg)){
				openChatRooms[msg].setOffline();
			}
			for(var i=0;i<socket.activeUserList.length;i++){
				if(socket.activeUserList[i].UserName == msg){
					socket.activeUserList.splice(i, 1);					
					break;
				}
			}
			if($(chat).find("#chat-people li[user='" + msg + "']").length > 0){
				$(chat).find("#chat-people li[user='" + msg + "'] div.status").removeClass("active");
			}
			if($(chat).find("#chat-recent li[user='" + msg + "']").length > 0){
				$(chat).find("#chat-recent li[user='" + msg + "'] div.status").removeClass("active");
			}
		});
		
		socket.on("new-message", function(msg){
			if(msg.type == "message"){
				createNewNotificationPopup(msg);
				nm.checkNewNotifications(url);
			}
		});
		
		socket.on("room-invite", function(msg){
			var adder;
			for(var i=0;i<socket.activeUserList.length;i++){
				if(socket.activeUserList[i].UserName == msg.from){
					adder = socket.activeUserList[i].FirstName + " " + socket.activeUserList[i].LastName;
					break;
				}
			}
			
			var room = {
				_id:		msg.room,
				Name:	msg.name
			};
			
			addRoomChatLink(room, url, "#chat-room-list");
			createNewNotificationPopup({message: "You've been added to the chatroom " + msg.name + " by " + adder}, "Chat Invite");
		});
		
		socket.on("pvt-message", function(msg){
			if(!openChatRooms.hasOwnProperty(msg.from)){
				for(var i=0;i<socket.activeUserList.length;i++){
					if(socket.activeUserList[i].UserName == msg.from){
						createChatRoom(socket.activeUserList[i], url);
					}
				}
			}
			else {
				openChatRooms[msg.from].addResponse(msg.message, msg.when);
			}
		});
		
		socket.on("room-message", function(msg){
			if(!openChatRooms.hasOwnProperty(msg.to)){
				var liCount = $(chat).find("#chat-room-list li[room='" + msg.to + "'] div.count").first();
				liCount[0].addOne();
			}
			else {
				openChatRooms[msg.to].addResponse(msg.message, msg.when, msg.from);
			}
		});
		
		socket.on("pvt-history", function(msg){
			if(openChatRooms.hasOwnProperty(msg.user)){
				openChatRooms[msg.user].setHistory(msg);
			}
		});
		
		socket.on("room-history", function(msg){
			if(openChatRooms.hasOwnProperty(msg.to)){
				console.log(msg.messages);
				openChatRooms[msg.to].setHistory(msg);
			}
		});
		
		socket.on("create-room", function(msg){
			if(msg.status == "success"){
				var room = {
					id:		msg.id,
					name: 	msg.Name
				};
				
				createChatRoom(room, url, true, false, true);
			}
		});
		
		socket.on("typing", function(msg){
			if(openChatRooms.hasOwnProperty(msg.from)){
				openChatRooms[msg.from].showTyping();
			}
		});
	}
	
	nm.notifications = function(url){
		WindowManager.loadModal("notifications", {
			getDetails:	function(){
				return {
					url:	url
				};
			}
		});
	}
	
	nm.closeConnection = function(url){
		sockets[url].disconnect();
		delete sockets[url];
	}
	
	nm.chat = function(url){
		$(chat).toggleClass("hide");
	}
	
	nm.checkNewNotifications = function(url){
		WindowManager.get(url + "/api/notifications/new", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					if(response.records.length > 0){
						var text = response.records.length;
						$("#notification-callout span").text(text).show();
					}
					else {
						$("#notification-callout span").hide();
					}
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function createNewNotificationPopup(msg, header){
		var pop = document.createElement("div");
		pop.className = "note-pop";
		header = header || "New Notification";
		$(pop).html("<h1>" + header + "</h1><p>" + msg.message + "</p>");
		notifications.appendChild(pop);
		
		var fade = function(){
			if($(pop).attr("hovered") !== 'true'){
				$(pop).css("opacity", $(pop).css("opacity") - (1/60));
			}
			if($(pop).css("opacity") > 0){
				window.requestAnimationFrame(fade);
			}
			else {
				notifications.removeChild(pop);
			}
		}
		window.requestAnimationFrame(fade);
		
		$(pop).on("mouseover", function(evt){
			$(pop).attr("hovered", true);
			$(pop).css("opacity", 1);
			
			$(pop).on("mouseout", function(evt){
				$(pop).attr("hovered", false);
			});
		});
	}
	
	function addUserChatLink(user, url, parent){
		var li = document.createElement("li");
		$(li).attr("user", user.UserName).attr("name", user.FirstName + " " + user.LastName);
		$(li).text(user.FirstName + " " + user.LastName);
		$(chat).find(parent).append(li);
		
		var statusDiv = document.createElement("div");
		$(statusDiv).addClass("status").html("<i class='fa fa-circle'></i>");
		for(var i=0;i<sockets[url].activeUserList.length;i++){
			if(sockets[url].activeUserList[i].UserName == user.UserName){
				$(statusDiv).addClass("active");
				break;
			}
		}
		$(li).append(statusDiv);
		
		$(li).on("click touch", function(evt){
			$(chat).addClass("hide");
			if(!openChatRooms.hasOwnProperty(user.UserName)){
				user.id = user.UserName;
				user.name = user.FirstName + " " + user.LastName;
				createChatRoom(user, url, false, !$(statusDiv).hasClass("active"));
			}
			else {
				openChatRooms[user.UserName].open();
			}
		});
	}
	
	function addRoomChatLink(room, url, parent){
		var li = document.createElement("li");
		$(li).attr("room", room["_id"]);
		if(room.type == "wall"){
			room.Name += "'s Wall Chat";
		}
		$(li).text(room.Name);
		$(chat).find(parent).append(li);
		
		var messageCount = document.createElement("div");
		$(messageCount).addClass("count").attr("count", 0);
		$(li).append(messageCount);
		
		messageCount.addOne = function(){
			$(messageCount).attr("count", parseInt($(messageCount).attr("count"))+1);
			$(messageCount).text($(messageCount).attr("count"));
		}
		
		$(li).on("click touch", function(evt){
			$(chat).addClass("hide");
			if(!openChatRooms.hasOwnProperty(room["_id"])){
				room.id = room["_id"]
				room.name = room.Name;
				createChatRoom(room, url, true, false, (room.type == "custom"));
			}
			else {
				openChatRooms[room["_id"]].open();
			}
		});
	}
	
	function createChatRoom(details, url, isRoom, isOffline, isCustomRoom){
		var chatroom = new ChatRoom(details, sockets[url], isRoom, isOffline, isCustomRoom);
		$(chatroom).css("right", (17*Object.keys(openChatRooms).length) + "%");
		
		$(chatrooms).append(chatroom);
		openChatRooms[details.id] = chatroom;
		chatroom.open();
	}
	
	return nm;
});