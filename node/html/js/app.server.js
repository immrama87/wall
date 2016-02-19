$(function(){
	var serviceStatus = document.getElementById("service-status");
	var status = serviceStatus.className;
	var logBreadcrumbs = document.getElementById("log-breadcrumbs");
	var logList = document.getElementById("log-list");
	var logDetails = document.getElementById("log-details");
	
	if(status == "started"){
		$("#restart").removeAttr("disabled").addClass("enabled");
	}
	
	$(serviceStatus).text(status.charAt(0).toUpperCase() + status.substring(1));
	
	$("#restart").on("click touch touchstart", function(evt){
		$.ajax({
			method:		"post",
			url:		"/app/restartService",
			data:		{},
			dataType:	"json",
			success:	function(response, status, xhr){
				serviceStatus.className = "stopped";
				$(serviceStatus).text("Stopped");
				startStatusPoller(0);
			},
			error:		function(xhr, status, error){
				alert(error);
			}
		});
	});
	
	$(logList).find("li a").on("click touch touchstart", function(evt){
		var link = document.createElement("a");
		link.href="javascript:void(0);";
		$(link).on("click touch touchstart", function(a_evt){
			showList();
		});
		$(link).append("Log Files");
		
		$(logBreadcrumbs).html("").append(link).append(" > ").append($(this).attr("file-link"));
		showFileContents($(this).attr("file-link"));
	});
	
	function showList(){
		$(logList).show();
		$(logDetails).hide();
		$(logBreadcrumbs).html("Log Files");
	}
	
	function showFileContents(fileName){
		var pageSize = ["25", "50", "75", "100", "250"];
		$(logList).hide();
		$(logDetails).html("").show();
		$.ajax({
			method:		"get",
			url:		"/app/logs/" + fileName,
			dataType:	"json",
			success:	function(response, status, xhr){
				var ol = document.createElement("ol");
				ol.className = "log-lines";
				var select = document.createElement("select");
				
				for(var i=0;i<pageSize.length;i++){
					var option = document.createElement("option");
					option.value = pageSize[i];
					$(option).html(pageSize[i]);
					$(select).append(option);
				}
				
				renderFileLines(response.data, ol, select);
				
				
				var fileLink = document.createElement("a");
				fileLink.href = "/app/logs/" + fileName + "/Download";
				fileLink.target = "_blank";
				$(fileLink).html("Download file");
				
				$(logDetails).html("Showing last ").append(select).append(" lines of " + response.total).append(ol).append(fileLink);
				
				$(select).on("change", function(evt){
					$.ajax({
						method:		"get",
						url:		"/app/logs/" + fileName,
						data:		{lines:	$(select).val()},
						dataType:	"json",
						success:	function(sel_res, sel_stat, sel_xhr){
							renderFileLines(sel_res.data, ol, select);
						},
						error:		function(sel_xhr, sel_stat, sel_err){
							alert(sel_err);
						}
					});
				});
			},
			error:		function(xhr, status, error){
				alert(error);
			}
		});
	}
	
	function renderFileLines(data, ol, select){
		$(ol).html("");
		for(var i=0;i<data.length;i++){
			$(ol).append("<li><span>" + data[i] + "</span></li>");
		}
		
		if(data.length < 25){
			$(select).html("<option value='" + data.length + "'>" + data.length + "</option>");
		}
	}
	
	function startStatusPoller(iter){
		$.ajax({
			method:		"get",
			url:		"/app/status",
			dataType:	"json",
			success:	function(response, status, xhr){
				serviceStatus.className = response.status;
				$(serviceStatus).text(response.status.charAt(0).toUpperCase() + response.status.substring(1));
				if(response.status != "started" && iter < 20){
					startStatusPoller(iter++);
				}
				else if(iter >= 20){
					alert("An error occurred. The server may need to be manually restarted.");
				}
			},
			error:		function(xhr, status, error){
				serviceStatus.className = "stopped";
				$(serviceStatus).text("Stopped");
				startStatusPoller();
			}
		});
	}
});