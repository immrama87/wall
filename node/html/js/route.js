$(function(){
	$.each($("button.send-request"), function(index, button){
		var routeDiv = $(button).parents("div.route")[0];
		var params = $(routeDiv).find("div.param-field");
		
		if(params.length > 0){
			$.each(params, function(index, param){
				if($(button).attr("submittable") != "unsubmittable"){
					$(param).find("div.param-value input").on("change keyup", function(evt){
						if($(this).val() != "" && $(this).val() != undefined){
							button.isEnabled();
						}
					});
				}
				else {
					$("<li class='param-name'>" + $(param).find("div.param-label").html().replace(":", "").trim() + "</li>").insertBefore(param);
					if($(routeDiv).find("p.required-message").length == 0){
						$("<p class='required-message'>Parameters Required:</p>").insertBefore($(routeDiv).find("li.param-name"));
					}
					$(param).remove();
				}
			});
		}
		
		console.log($(button).attr("submittable"));
		if($(button).attr("submittable") == "unsubmittable"){
			$("<p class='no-submit'>This route cannot be tested here.</p>").insertBefore(button);
			$(routeDiv).find(".try-it-now").remove();
			$(routeDiv).find("div.output").remove();
			$(button).remove();
		}
		
		button.isEnabled = function(){
			var enabled = true;
			$.each(params, function(index, param){
				var input = $(param).find("div.param-value input");
				if(!$(input).hasClass("optional")){
					if($(input).val() == undefined || $(input).val() == ""){
						enabled = false;
					}
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
				console.log(param);
				
				data[key] = value;
			});
			
			var endPoint = $(this).attr("end-point");
			
			var index = 0;
			while((index = endPoint.indexOf("{")) > -1){
				var end = endPoint.indexOf("}", index);
				var key = endPoint.substring(index+1, end);
				endPoint = endPoint.substring(0, index) + data[key] + endPoint.substring(end+1);
				
				delete data[key];
			}
			
			$.ajax({
				method:		$(this).attr("method").toLowerCase(),
				url:		endPoint,
				data:		data,
				dataType:	"json",
				success:	function(data, status, xhr){
					populateResults(routeDiv, data);
				},
				error:		function(xhr, status, error){
					populateResults(routeDiv, error, true);
				}
			});
		});
		
		button.isEnabled();
	});	
	
	function populateResults(div, data, isError){
		var output = $(div).find("div.output")[0];
		if(isError){
			$(output).addClass("error").html(formatData(data));
		}
		else {
			$(output).addClass("results").html(formatData(data));
		}
		
		$.each($(output).find("li"), function(index, el){
			if($(el).find("ul").length > 0){
				$(el).attr("is-open", false);
				$(el).on("click touch touchstart", function(evt){
					if($(el).attr("is-open") === 'true'){
						$(el).attr("is-open", false);
						$(el).removeClass("open");
					}
					else {
						$(el).attr("is-open", true);
						$(el).addClass("open");
					}
					evt.stopPropagation();
				});
			}
		});
	}

	function formatData(data){
		var result = "";
		
		if(Object.prototype.toString.call(data) === '[object Object]' ||
			Object.prototype.toString.call(data) === '[object Array]'){
			result = formatObject(data);
		}
		else {
			result = "<p>" + data + "</p>";
		}
		
		return result;
	}
	
	function formatObject(obj){
		var result = "<ul>";
		for(var i in obj){
			if(Object.prototype.toString.call(obj[i]) === '[object Object]' ||
				Object.prototype.toString.call(obj[i]) === '[object Array]'){
				result += "<li class='object-li'>" + i + ": <span class='value'>Object</span>" + formatObject(obj[i]) + "</li>";
			}
			else {
				var value = obj[i];
				if(isNaN(parseInt(obj[i])) && typeof obj[i] != "boolean"){
					value = "\"" + value + "\"";
				}
				if(i == "_id"){
					value = "ObjectId(\"" + value + "\")";
				}
				result += "<li class='property-li'>" + i + ": <span class='value'>" + value + "</span></li>";
			}
		}
		
		result += "</ul>";
		return result;
	}
});