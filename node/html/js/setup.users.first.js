$(function(){
	var save = document.getElementById("save");
	if(save != undefined){
		save.checkEnabled = function(){
			var enabled = true;
			$.each($("section.setup").find("input"), function(index, el){
				if($(el).val() == "" || $(el).val() == undefined){
					enabled = false;
				}
			});
			
			if(enabled){
				$(save).removeAttr("disabled");
				$(save).addClass("enabled");
			}
			else {
				$(save).attr("disabled", true);
				$(save).removeClass("enabled");
			}
		}
		
		$("section.setup input").on("keyup change", function(evt){
			if($(this).val() != "" && $(this).val() != undefined){
				save.checkEnabled();
			}
		});
		
		$(save).on("click touch touchstart", function(evt){
			if($("#Password").val() != $("#Password_conf").val()){
				alert("The passwords do not match. Update the Password and Confirm Password fields and try again.");
			}
			else {
				var data = {};
				$.each($("section.setup").find("input"), function(index, el){
					if($(el).attr("ignore") !== 'true'){
						data[el.id] = $(el).val();
					}
				});
				
				$.ajax({
					method:		'post',
					url:		'/setup/users/first',
					data:		data,
					dataType:	'json',
					success:	function(response, status, xhr){
						if(response.status == "error"){
							alert(response.data);
						}
						else {
							enableProceed();
						}
					},
					error:		function(xhr, status, error){
						alert(error);
					}
				});
			}
		});
		
		save.checkEnabled();
	}
	
	function enableProceed(){
		$("#proceed").removeAttr("disabled");
		$(save).attr("disabled", true);
		$(save).removeClass("enabled");
	}
});