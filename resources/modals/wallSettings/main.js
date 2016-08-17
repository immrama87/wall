var controller = (function(target){
	var details = target.catTable.getDetails();
	var catTable;
	var actionTable;
	var userTable;
	target.init = function(){
		target.nav.select("categories");
		
		WindowManager.get(details.url + "/api/users", {
			success:	function(data){
				target.username.appendChild(document.createElement("option"));
				var response = JSON.parse(data);
				if(response.status == "success"){
					for(var i=0;i<response.records.length;i++){
						target.username.appendChild(generateUserOption(response.records[i]));
					}
					
					$(target.addUser).on("click touch", function(evt){
						WindowManager.post(details.url + "/api/walls/" + details.wallId + "/users", {UserName: target.username.value}, {
							success:	function(data){
								updateUserTable();
							}
						});
					});
				}
				else {
					alert(response.data);
				}
			}
		});
		
		loadCatTable();
		loadActionTable();
		loadUserTable();
	}
	
	function generateUserOption(user){
		var option = document.createElement("option");
		option.text = user.FirstName + " " + user.LastName + " (" + user.UserName + ")";
		option.value = user.UserName;
		return option;
	}
	
	function loadCatTable(){
		catTable = $(target.catTable).DataTable({
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
		
		$(target.catTable).find("tbody").on("click touch", "tr", function(){
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
		
		$(target.addCategory).on("click touch", function(){
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
				close:		updateCatTable
			});
		});
		
		
		updateCatTable();
	}
	
	function updateCatTable(){
		WindowManager.get(details.url + "/api/walls/" + details.wallId + "/categories", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					catTable.data().clear().draw();
					for(var i=0;i<response.records.length;i++){
						var row = [response.records[i].Name, generateColorCellHTML(response.records[i].Color), response.records[i]._id];
						catTable.row.add(row);
					}
					
					catTable.draw();
					
					$(target.catTable).find("td.delete-row").on("click touch", function(evt){
						if(confirm("Are you sure you want to delete this category?")){
							var catId = $(this).parents("tr")[0].id;
							
							WindowManager.del(details.url + "/api/walls/" + details.wallId + "/categories/" + catId, undefined, {
								success:	function(data){
									var response = JSON.parse(data);
									if(response.status == "success"){
										$(target.addCategory).html("Add Category");
										updateCatTable();
									}
									else {
										alert(response.data);
									}
								}
							});
						}
					});
				}
				else {
					alert(response.data);
				}
			}
		});
	}
	
	function loadActionTable(){
		actionTable = $(target.actionTable).DataTable({
			info:			false,
			searching:		false,
			lengthChange:	false,
			pagingType:		"numbers",
			rowId:			"0",
			columns:		[
				{
					title:		"Action Type",
					name:		"ActionKey"
				},
				{
					title:		"Approval Required",
					name:		"Approval",
					sortable:	false
				},
				{
					title:		"Notifications Sent",
					name:		"Notification",
					sortable:	false
				},
				{
					title:			"",
					sortable:		false,
					className:		"delete-row",
					defaultContent:	"<i class='fa fa-times'></i>"
				}
			]
		});
		
		$(target.actionTable).find("tbody").on("click touch", "tr", function(){
			if($(this).hasClass("selected")){
				$(this).removeClass("selected");
				$(target.addAction).html("Add Action");
			}
			else {
				$(target.actionTable).find("tr.selected").removeClass("selected");
				$(this).addClass("selected");
				$(target.addAction).text("Update Action");
			}
		});
		
		$(target.addAction).on("click touch", function(){
			var id;
			if($(target.actionTable).find("tr.selected").length > 0){
				id = $(target.actionTable).find("tr.selected")[0].id;
			}
			
			WindowManager.loadModal("addWallAction", {
				getDetails:	function(){
					return {
						wallId:		details.wallId,
						actionKey:	id,
						url:		details.url
					};
				},
				close:		updateActionTable
			});
		});
		
		updateActionTable();
	}
	
	function updateActionTable(){
		WindowManager.get(details.url + "/api/walls/" + details.wallId + "/actions", {
			success:	function(data){
				var response = JSON.parse(data);
				if(response.status == "success"){
					actionTable.data().clear().draw();
					for(var i=0;i<response.records.length;i++){
						var row = [response.records[i].ActionKey, response.records[i].Approval, response.records[i].Notification];
						actionTable.row.add(row);
					}
					
					actionTable.draw();
					
					$(target.actionTable).find("td.delete-row").on("click touch", function(evt){
						if(confirm("Are you sure you want to delete this action?")){
							var actionId = $(this).parents("tr")[0].id;
							
							WindowManager.del(details.url + "/api/walls/" + details.wallId + "/actions/" + actionId, undefined, {
								success:	function(data){
									var response = JSON.parse(data);
									if(response.status == "success"){
										$(target.addAction).html("Add Action");
										updateActionTable();
									}
									else {
										alert(response.data);
									}
								}
							});
						}
					});
				}
				else {
				
				}
			}
		});
	}
	
	function loadUserTable(){
		userTable = $(target.userTable).DataTable({
			info:			false,
			searching:		false,
			lengthChange:	false,
			pagingType:		"numbers",
			rowId:			"2",
			columns:		[
				{
					title:		"First Name",
					name:		"FirstName"
				},
				{
					title:		"Last Name",
					name:		"LastName"
				},
				{
					title:		"User Name",
					name:		"UserName"
				},
				{
					title:			"",
					sortable:		false,
					className:		"delete-row",
					defaultContent:	"<i class='fa fa-times'></i>"
				}
			]
		});
		
		updateUserTable();
	}
	
	function updateUserTable(){
		WindowManager.get(details.url + "/api/walls/" + details.wallId + "/users", {
			success:	function(data){
				var response = JSON.parse(data);
				var requests = 0;
				if(response.status == "success"){
					if(response.records[0].UserAccessList){
						userTable.data().clear().draw();
						for(var i=0;i<response.records[0].UserAccessList.length;i++){
							requests ++;
							WindowManager.get(details.url + "/api/users/" + response.records[0].UserAccessList[i], {
								success:	function(userGet){
									var user = JSON.parse(userGet);
									var row = [user.records[0].FirstName, user.records[0].LastName, user.records[0].UserName];
									userTable.row.add(row);
									requests--;
									if(requests == 0){
										userTable.draw();
									}
								}
							});
						}
						
						userTable.draw();
					}
				}
				else {
					alert(response.data);
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