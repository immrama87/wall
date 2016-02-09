var controller = (function(target){
	var details = target.catTable.getDetails();
	var table;
	target.init = function(){
		target.nav.select("categories");
		
		loadTable();
	}
	
	function loadTable(){
		table = $(target.catTable).DataTable({
			info:			false,
			searching:		false,
			lengthChange:	false,
			pagingType:		"numbers",
			rowId:			"2",
			columns:		[
				{
					title:		"Name",
					name:		"Name"
				},
				{
					title:		"Color",
					name:		"Color"
				},
				{
					name: 		"_id",
					visible:	false					
				},
				{
					title:			"",
					sortable:		false,
					className:		"delete-row",
					defaultContent:	"<i class='fa fa-times'></i>"
				}
			]
		});
		
		$(target.catTable).find("tbody").on("click touch touchstart", "tr", function(){
			if($(this).hasClass("selected")){
				$(this).removeClass("selected");
				$(target.addCategory).html("Add Category");
			}
			else {
				$(target.catTable).find("tr.selected").removeClass("selected");
				$(this).addClass("selected");
				$(target.addCategory).text("Update Category");
			}
		});
		
		$(target.addCategory).on("click touch touchstart", function(){
			var id;
			if($(target.catTable).find("tr.selected").length > 0){
				id = $(target.catTable).find("tr.selected")[0].id;
			}
			
			WindowManager.loadModal("addCategory", {
				getDetails:	function(){
					return {
						wallId:	details.wallId,
						catId:	id,
						url:	details.url
					};
				},
				close:		updateTable
			});
		});
		
		
		updateTable();
	}
	
	function updateTable(){
		WindowManager.get(details.url + "/api/walls/" + details.wallId + "/categories", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					table.data().clear().draw();
					for(var i=0;i<response.records.length;i++){
						var row = [response.records[i].Name, generateColorCellHTML(response.records[i].Color), response.records[i]._id];
						table.row.add(row);
					}
					
					table.draw();
					
					$(target.catTable).find("td.delete-row").on("click touch touchstart", function(evt){
						var catId = $(this).parents("tr")[0].id;
						
						WindowManager.del(details.url + "/api/walls/" + details.wallId + "/categories/" + catId, undefined, {
							success:	function(data){
								var response = JSON.parse(data);
								if(response.status == "success"){
									$(target.addCategory).html("Add Category");
									updateTable();
								}
								else {
									alert(response.data);
								}
							}
						});
					});
				}
			}
		});
	}
	
	function generateColorCellHTML(color){
		var colorDiv = document.createElement("div");
		colorDiv.className = "color-div";
		colorDiv.style.background = color;
		
		return colorDiv.outerHTML + "&nbsp;" + color;
	}
});