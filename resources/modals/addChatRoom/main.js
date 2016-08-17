var controller = (function(target){
	var details = target.details.getDetails();
	
	target.init = function(){
		target.name.focus();
	}
	
	$(target.add).on("click touch", function(evt){
		details.socket.emit("create-room", target.name.value);
		target.close();
	});
});