define("windowManager/Tabulator/data", [], function(){
	var d = {};
	
	d.getManager = function(table, config){
		return new Manager(table, config);
	}
	
	var Manager = (function(table, config){
		var m = {};
		
		var data = [];
		
		m.initTable = function(){
			for(var i=0;i<config.cols.length;i++){
				if(config.cols[i].sortable){
					var header = table.thead.rows[0];
					for(var j=0;j<header.cells.length;j++){
						if(header.cells[j].key == config.cols[i].key){
							if(!header.cells[j].hasAttribute("is-sorted")){
								header.cells[j].setAttribute("is-sorted", false);
								enableSort(header.cells[j]);
							}
							
							break;
						}
					}
				}
			}
		}
		
		
		
		return m;
	});
	
	return d;
});