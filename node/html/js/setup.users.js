$(function(){
	var propsDiv = document.getElementById("properties");
	var button = document.getElementById("save");
	var clear = document.getElementById("clear");
	
	button.checkEnabled = function(){
		var enabled = true;
		$.each($(propsDiv).find("input"), function(index, el){
			if(($(el).val() == "" || $(el).val() == undefined) && (!$(el).attr("optional"))){
				enabled = false;
			}
		});
		
		if(!enabled){
			$(button).attr("disabled", true);
			$(button).removeClass("enabled");
		}
		else {
			$(button).removeAttr("disabled");
			$(button).addClass("enabled");
		}
	}
	
	clear.checkEnabled = function(){
		var enabled = false;
		$.each($(propsDiv).find("input"), function(index, el){
			if($(el).val() != "" && $(el).val() != undefined){
				enabled = true;
			}
		});
		
		if(!enabled){
			$(clear).attr("disabled", true);
			$(clear).removeClass("enabled");
		}
		else {
			$(clear).removeAttr("disabled");
			$(clear).addClass("enabled");
		}
	}
	
	$.each($(propsDiv).find("input"), function(index, el){
		$(el).on("keyup change", function(evt){
			clear.checkEnabled();
			button.checkEnabled();
		});
	});
	
	$(clear).on("click touch touchstart", function(evt){
		$.each($(propsDiv).find("input"), function(index, el){
			$(el).val("");
		});
		
		button.checkEnabled();
		clear.checkEnabled();
	});
	
	$(button).on("click touch touchstart", function(evt){
		var data = {};
		$.each($(propsDiv).find("input"), function(index, el){
			if($(el).val() != undefined && $(el).val() != ""){
				data[el.id] = $(el).val();
			}
		});
		
		var url = "/api/users";
		if($(this).attr("action") == "put"){
			url += "/" + data["UserName"];
		}
		
		$.ajax({
			method:		$(this).attr("action"),
			url:		url,
			data:		data,
			dataType:	"json",
			success:	function(response, status, xhr){
				
			},
			error:		function(xhr, status, error){
				
			}
		});
	});
	
	$("table.selector tr").on("click touch touchstart", function(evt){
		if($(this).hasClass("selected")){
			$(this).removeClass("selected");
		}
		else {
			$("table.selector tr.selected").removeClass("selected");
			$(this).addClass("selected");
		}
		
		setProperties($(this));
	});
	
	$("#UserName").on("change keyup", function(evt){
		var user = $(this).val();
		var found = false;
		$.each($("table.selector tr[data]"), function(index, el){
			var rowUser = JSON.parse($(el).attr("data"));
			if(rowUser.UserName == user){
				el.click();
				found = true;
			}
		});
		
		if(!found){
			$("#_id").val("");
			$(button).html("Create User");
			$(button).attr("action", "post");
		}
	});
	
	function setProperties(tr){
		var user = JSON.parse($(tr).attr("data"));
		
		for(var i in user){
			var input = document.getElementById(i);
			if(input != undefined && input.tagName == "INPUT"){
				$(input).val(user[i]);
			}
		}
		
		$(button).html("Update User");
		$(button).attr("action", "put");
	}
});