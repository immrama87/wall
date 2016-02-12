$(function(){
	var propsDiv = document.getElementById("properties");
	var button = document.getElementById("save");
	
	$(propsDiv).hide();
	$(button).hide();
	
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
	
	$(button).on("click touch touchstart", function(evt){
		$("input.error-highlight").removeClass("error-highlight");
		var data = {};
		data.driver = $("table.selector tr.selected td.driver").html();
		var valid = true;
		var message = "";
		$.each($(propsDiv).find("input"), function(index, el){
			if(el.hasAttribute("validate")){
				if($(el).attr("validate") == "integer"){
					if(isNaN($(el).val())){
						valid = false;
						message += el.id + " parameter must be of type integer";
						$(el).addClass("error-highlight");
					}
				}
			}
			data[el.id] = $(el).val() || "";
		});
		
		if(!valid){
			alert(message);
		}
		else {
			$.ajax({
				method:		"post",
				url:		"/setup/db/Test",
				data:		data,
				dataType:	"json",
				success:	function(response, status, xhr){
					if(response.status == "success"){
						saveConfiguration(data);
					}
					else {
						if(response.highlight){
							for(var i=0;i<response.highlight.length;i++){
								console.log(response.highlight[i]);
								$("#" + response.highlight[i]).addClass("error-highlight");
							}
							alert(response.data);
						}
					}
				},
				error:		function(xhr, status, error){
					alert(error);
				}
			});
		}
	});
	
	$("table.selector tr").on("click touch touchstart", function(evt){
		if($(this).hasClass("selected")){
			$(this).removeClass("selected");
		}
		else {
			$("table.selector tr.selected").removeClass("selected");
			$(this).addClass("selected");
		}
		
		generateProperties(this);
	});
	
	if($("table.selector").attr("existing-config") != undefined){
		var existing = JSON.parse($("table.selector").attr("existing-config").replace(new RegExp("'", 'g'), "\""));
		var existing_row = document.getElementById(existing.driver);
		if(existing_row.tagName == "TR"){
			existing_row.click();
			
			for(var i in existing){
				var input = document.getElementById(i);
				if(input != undefined && input.tagName == "INPUT"){
					input.value = existing[i];
				}
			}
		}
		
		$("table.selector").removeAttr("existing-config");
	}
	
	function generateProperties(tr){
		if($(tr).hasClass("selected")){
			var props = JSON.parse($(tr).attr("props"));
			
			$(propsDiv).html("<h4>Properties:</h4>");
			for(var i=0;i<props.length;i++){
				$(propsDiv).append(generatePropInput(props[i]));
			}
			
			$.each($(propsDiv).find("input"), function(index, el){
				$(el).on("change keyup", function(evt){
					if($(el).val() != "" && $(el).val() != undefined){
						button.checkEnabled();
					}
				});
			});
			
			$(propsDiv).show();
			$(button).show();
		}
		else {
			$(button).hide();
			$(propsDiv).hide();
		}
	}
	
	function generatePropInput(prop){
		var propField = $("<div class='prop-field'></div>");
		$(propField).append("<div class='prop-label'>" + prop.name + "</div>");
		
		var propInputDiv = $("<div class='prop-value'></div>");
		var type = prop.type || "text";
		var propInput = $("<input type='" + type + "' id='" + prop.key + "' />");
		if(prop.validate != undefined){
			$(propInput).attr("validate", prop.validate);
		}
		if(prop.optional){
			$(propInput).attr("optional", true);
		}
		
		$(propInputDiv).append(propInput);
		$(propField).append(propInputDiv);
		
		return propField;
	}
	
	function saveConfiguration(data){
		$.ajax({
			method:		"post",
			url:		"/setup/db/Create",
			data:		data,
			dataType:	"json",
			success:	function(response, status, xhr){
				if(response.status == "error"){
					alert(response.data);
				}
				else {
					validateConfiguration();
				}
			},
			error:		function(xhr, status, error){
				alert(error);
			}
		});
	}
	
	function validateConfiguration(){
		$.ajax({
			method:		"get",
			url:		"/setup/db/Validate",
			dataType:	"json",
			success:	function(response, status, xhr){
				if(response.status == "success"){
				
				}
				else if(response.status == "invalid"){
					var message = response.data || "Missing Tables:";
					message += "\n\t * " + response.missing.join("\n\t * ") + "\nCreate?";
					
					if(confirm(message)){
						initializeDatabase(response.missing);
					}
				}
				else {
					alert(response.data);
				}
			},
			error:		function(xhr, status, error){
				alert(error);
			}
		});
	}
	
	function initializeDatabase(missing){
		$.ajax({
			method:	"put",
			url:	"/setup/db/Initialize",
			data:	{
				missing: 	missing
			},
			dataType:	"json",
			success:	function(response, status, xhr){
				if(response.status == "error"){
					alert(response.data);
				}
				else {
					
				}
			},
			error:		function(xhr, status, error){
				alert(error);
			}
		});
	}
});