define("notificationManager/ChatRoom", [], function(){
	return (function(details, socket, isRoom, isOffline, isCustomRoom){
		if(isRoom){
			socket.emit("room-history", {id: details.id});
		}
		else {
			socket.emit("pvt-history", {user: details.id});
		}
		var chatroom = document.createElement("div");
		chatroom.locked = true;
		$(chatroom).addClass("chat-room open");
		
		var header = document.createElement("div");
		$(header).addClass("header");
		$(header).text(details.name);
		$(chatroom).append(header);
		
		$(header).on("click touch", function(evt){
			$(chatroom).toggleClass("open");
			$(header).removeClass("new");
		});
		
		var close = document.createElement("button");
		$(close).addClass("close");
		$(close).text("X");
		$(header).append(close);
		
		$(close).on("click touch", function(evt){
			$(chatroom).remove();
			delete openChatRooms[details.id];
		});
		
		if(isCustomRoom){
			var addUsers = document.createElement("div");
			$(addUsers).addClass("add-users close");
			$(addUsers).html("<i class='fa fa-plus'></i>");
			$(header).append(addUsers);
			
			$(addUsers).on("click touch", function(evt){
				evt.stopPropagation();
				console.log(details.Users);
				var userPop = document.createElement("div");
				$(userPop).addClass("user-pop");
				for(var i=0;i<socket.activeUserList.length;i++){
					if(details.Users.indexOf(socket.activeUserList[i].UserName) == -1){
						$(userPop).append(createUserAddLink(socket.activeUserList[i]));
					}
				}
				
				if($(userPop).find(".user-add").length > 0){
					$(header).append(userPop);
					$(userPop).append("<div class='caret'></div>");
				}
			});
		}
		
		var contentFrame = document.createElement("div");
		$(contentFrame).addClass("content-frame");
		$(chatroom).append(contentFrame);
		
		var messageFrame = document.createElement("div");
		$(messageFrame).addClass("message-frame");
		$(chatroom).append(messageFrame);
		
		var messageInput = document.createElement("textarea");
		$(messageFrame).append(messageInput);
		
		$(messageInput).on("keyup", function(evt){
			if(evt.which == 13 && !evt.shiftKey){
				var now = new Date().getTime();
				if(isRoom){
					socket.emit("room-message", {to: details.id, message: $(messageInput).val(), when: now});
				}
				else {
					socket.emit("pvt-message", {to: details.id, message: $(messageInput).val(), when: now});
				}
				addOutgoing($(messageInput).val(), now);
				$(messageInput).val("");
			}
			else if($(messageInput).val().trim().length > 0){
				socket.emit("typing", {to: details.id});
			}
		});
		
		$(messageInput).on("focus", function(evt){
			$(header).removeClass("new");
		});
		
		var lastTimeCountdown;
		var lastTime;
		
		chatroom.setHistory = function(history){
			var earlier = undefined;
			if($(contentFrame).find("div.earlier-link").length > 0){
				earlier = $(contentFrame).find("div.earlier-link")[0];
			}
			if(history.earlier){
				createEarlierLink(history.nextEnd, earlier);
			}
			for(var i=0;i<history.messages.length;i++){
				if(i > 0){
					if(history.messages[i].when > history.messages[i-1].when + (20*60*1000)){
						lastTime = history.messages[i-1].when;
						showLastTime();
					}
				}
				if(history.messages[i].from == details.id || (isRoom && history.messages[i].from != undefined)){
					createMessage(history.messages[i].message, "incoming", history.messages[i].when, earlier, history.messages[i].from);
				}
				else {
					createMessage(history.messages[i].message, "outgoing", undefined, earlier);
				}
			}
			
			
			if(earlier){
				lastTime = history.messages[history.messages.length - 1].when;
				showLastTime(earlier);
				$(earlier).remove();
			}
			else {
				contentFrame.scrollTop = contentFrame.scrollHeight;
			}
			
			if(isOffline){
				chatroom.setOffline();
			}
		}
		
		chatroom.addResponse = function(msg, time, user){
			var message = $(contentFrame).find("div.message").last();
			if($(message).hasClass("typing")){
				message[0].clear();
				chatroom.addResponse(msg, time);
				return;
			}
			
			createMessage(msg, "incoming", time, undefined, user);
			
			lastTime = time;
			startLastTimeCountdown();
			
			$(header).addClass("new");
		}
		
		chatroom.showTyping = function(){
			window.clearTimeout(lastTimeCountdown);
			var message = $(contentFrame).find("div.message").last();
			if(!$(message).hasClass("typing")){
				var clear = document.createElement("div");
				$(clear).addClass("clear");
				$(contentFrame).append(clear);
				
				var typing = document.createElement("div");
				$(typing).addClass("typing message").text("...");
				$(contentFrame).append(typing);
				
				contentFrame.scrollTop = contentFrame.scrollHeight;

				var timeout;
				
				typing.clear = function(){
					$(clear).remove();
					$(typing).remove();
					startLastTimeCountdown();
					
					contentFrame.scrollTop = contentFrame.scrollHeight;
				}
				
				typing.updateTimeout = function(){
					timeout = window.setTimeout(function(){
						typing.fadeOut();
					}, 5000);
				}
				
				typing.fadeOut = function(){
					$(typing).animate({"opacity": 0}, 400, function(){
						typing.clear();
					});
				}
				
				typing.updateTimeout();
			}
			else {
				$(message).stop();
				$(message).css("opacity", 1);
				message[0].updateTimeout();
			}
		}
		
		chatroom.setOffline = function(){
			var message = document.createElement("div");
			$(message).addClass("offline message").html(details.name + " is offline.<br /> They will receive your messages the next that time they login.");
			$(contentFrame).append(message);
			contentFrame.scrollTop = contentFrame.scrollHeight;
		}
		
		chatroom.setOnline = function(){
			$(contentFrame).find("div.offline").remove();
			isOffline = false;
		}
		
		chatroom.open = function(){
			$(chatroom).addClass("open");
			if($(header).hasClass("new")){
				contentFrame.scrollTop = contentFrame.scrollHeight;
				$(header).removeClass("new");
			}
			
			$(messageInput).focus();
		}
		
		function createUserAddLink(user){
			var link = document.createElement("div");
			$(link).addClass("user-add");
			$(link).text(user.FirstName + " " + user.LastName);
			
			$(link).on("click touch", function(evt){
				socket.emit("room-add-user", {id: details.id, user: user.UserName, name: details.name});
				$(link).parent().remove();
				evt.stopPropagation();
			});
			
			return link;
		}
		
		function createMessage(msg, type, time, before, user){
			console.log(user);
			var lastMessage = $(contentFrame).find("div.message").last();
			msg = msg.trim().replace(/\n/g, "<br />");
			
			if($(lastMessage).hasClass(type) && !before){
				$(lastMessage).append("<br />" + msg);
				contentFrame.scrollTop = contentFrame.scrollHeight;
			}
			else {
				var clear = document.createElement("div");
				$(clear).addClass("clear");
				if(before){
					$(clear).insertBefore(before);
				}
				else {
					$(contentFrame).append(clear);
				}
				
				if(type == "incoming"){
					var userHeader = document.createElement("div");
					var name = details.name;
					if(user){
						if($(chat).find("#chat-people li[user='" + user + "']").length > 0){
							name = $(chat).find("#chat-people li[user='" + user + "']").first().attr("name");
						}
						else {
							name = user;
						}
					}
					
					$(userHeader).addClass("incoming message user-mark").text(name + " - " + WindowManager.formatDate(time));
					if(before){
						$(userHeader).insertBefore(before);
					}
					else {
						$(contentFrame).append(userHeader);
					}
				}
				
				var message = document.createElement("div");
				$(message).addClass(type + " message").html(msg);
				if(before){
					$(message).insertBefore(before);
				}
				else {
					$(contentFrame).append(message);
					contentFrame.scrollTop = contentFrame.scrollHeight;
				}
			}
		}
		
		function createEarlierLink(end, before){
			var link = document.createElement("div");
			$(link).addClass("earlier-link").text("Load Earlier Messages");
			
			$(link).on("click touch", function(evt){
				if(isRoom){
					socket.emit("room-history", {id: details.id, end: end});
				}
				else {
					socket.emit("pvt-history", {user: details.id, end: end});
				}
			});
			
			if(before){
				$(link).insertBefore(before);
			}
			else {
				$(contentFrame).append(link);
			}
		}
		
		function addOutgoing(msg, time, addTyping){
			var message = $(contentFrame).find("div.message").last();
			if($(message).hasClass("typing")){
				message[0].clear();
				addOutgoing(msg, time, true);
				return;
			}
			createMessage(msg, "outgoing");
			
			lastTime = time;
			startLastTimeCountdown();
			
			if(addTyping){
				chatroom.showTyping();
			}
		}
		
		function startLastTimeCountdown(){
			window.clearTimeout(lastTimeCountdown);
			lastTimeCountdown = window.setTimeout(function(){
				showLastTime();
			}, 2*60*1000);
		}
		
		function showLastTime(before){
			var timeDiv = document.createElement("div");
			$(timeDiv).addClass("time message").text(WindowManager.formatDate(lastTime));
			if(before){
				$(timeDiv).insertBefore(before);
			}
			else {
				$(contentFrame).append(timeDiv);
				contentFrame.scrollTop = contentFrame.scrollHeight;
			}
		}
		
		return chatroom;
	});
});