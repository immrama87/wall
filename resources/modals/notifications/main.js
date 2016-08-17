var controller = (function(target){
	var details = target.details.getDetails();
	var notificationTable = $(target.notificationsTable).DataTable({
		info:			false,
		searching:		false,
		lengthChange:	false,
		pagingType:		"numbers",
		rowId:			"2",
		order:			[[0, "desc"]],
		columns:		[
			{
				title:		"Create Date",
				name:		"CreateDate"
			},
			{
				title:		"Message",
				name:		"note"
			},
			{
				name:		"_id",
				visible:	false
			},
			{
				name:		"read",
				visible:	false
			}
		],
		language:	{
			emptyTable:	"You have no notifications"
		},
		rowCallback:	function(row, data, index){
			if(data[3] == false){
				$(row).css("font-weight", "bold");
			}
			
			$(row).on("click touch", function(evt){
				
			});
			
			$(row).find("td")[0].innerHTML = WindowManager.formatDate(data[0]);
		},
		drawCallback:	function(settings){
			$(this).find("tbody").on("click touch", "tr", function(evt){
				var r = this;
				WindowManager.put(details.url + "/api/notifications/" + this.id, {}, {
					success:	function(data){
						var response = JSON.parse(data);
						if(response.status == "success"){
							$(r).css("font-weight", "normal");
							
							NotificationManager.checkNewNotifications(details.url);
						}
						else {
							alert(response.data);
						}
					}
				});
			});
		}
	});
	
	WindowManager.get(details.url + "/api/notifications", {
		success:	function(data){
			var response = JSON.parse(data);
			if(response.status == "success"){
				for(var i=0;i<response.records.length;i++){
					var row = [response.records[i].CreateDate, response.records[i].note, response.records[i]["_id"], response.records[i].read];
					notificationTable.row.add(row);
				}
				
				notificationTable.draw();
				
				
			}
			else {
				alert(response.data);
			}
		}
	});
});