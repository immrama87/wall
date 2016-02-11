$(function(){
	var button = $("#login-button");
	console.log(button);
	
	var login = $("section.login")[0];
	var params = $(login).find("div.param-field");
	
	if(params.length > 0){
		$.each(params, function(index, param){
			$(param).find("div.param-value input").on("change keyup", function(evt){
				if($(this).val() != "" && $(this).val() != undefined){
					button.isEnabled();
				}
			});
		});
	}
	
	button.isEnabled = function(){
		var enabled = true;
		$.each(params, function(index, param){
			var input = $(param).find("div.param-value input");
			if($(input).val() == undefined || $(input).val() == ""){
				enabled = false;
			}
		});
		
		if(enabled){
			$(button).addClass("enabled");
			$(button).removeAttr("disabled");
		}
		else {
			$(button).removeClass("enabled");
			$(button).attr("disabled", true);
		}
	};
	
	$(button).on("click touch touchstart", function(evt){
		var data = {};
		$.each(params, function(index, param){
			var key = $(param).find("div.param-label").html().replace(":", "").trim();
			var value = $(param).find("div.param-value input").val();
			console.log($(param).find("div.param-value input").val());
			
			data[key] = value;
		});
		
		$.ajax({
			method:		$(this).attr("method").toLowerCase(),
			url:		$(this).attr("end-point"),
			data:		data,
			dataType:	"json",
			success:	function(response, status, xhr){
				console.log(response);
				if(response.status == "success"){
					window.location.reload();
				}
				else {
					alert(response.data);
				}
			},
			error:		function(xhr, status, error){
				alert(error);
			}
		});
	});
	
	button.isEnabled();
});