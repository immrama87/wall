$(function(){
	var wallsList = document.getElementById("walls");
	var usersWoList = document.getElementById("users-wo");
	var usersWithList = document.getElementById("users-with");
	
	$(usersWoList).html("Select a wall");
	$(usersWithList).html("Select a wall");
	
	$.ajax({
		method:		"get",
		url:		"/api/walls",
		dataType:	"json",
		success:	function(response, status, xhr){
			if(response.metadata.size == 0){
				$(wallsList).html("No walls configured");
			}
			else {
				$(wallsList).html("");
				for(var i=0;i<response.metadata.size;i++){
					$(wallsList).append("<li wall-id='" + response.records[i]._id + "'>" + response.records[i].Name + "</li>");
				}
			}
		},
		error:		function(xhr, status, error){
			alert(error);
		}
	});
});