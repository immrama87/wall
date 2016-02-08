define("windowManager/Tabulator/formatter", [], function(){
	var f = {};
	
	f.getFormatter = function(table, config){
		return new Formatter(table, config);
	}
	
	var Formatter = (function(table, config){
		var fm = {};
		
		var thead, tbody;
		fm.initFormat = function(){
			table.innerHTML = "";
			
			thead = document.createElement("thead");
			table.thead = thead;
			table.appendChild(thead);
			
			tbody = document.createElement("tbody");
			table.appendChild(tbody);
			
			generateHeaderRow();
		}
		
		fm.renderData = function(data){
		
		}
		
		function generateHeaderRow(){
			var header = document.createElement("tr");
			
			for(var i=0;i<config.cols.length;i++){
				header.appendChild(generateHeaderCell(config.cols[i]));
			}
			thead.appendChild(header);
		}
		
		function generateHeaderCell(colConfig){
			var th = document.createElement("th");
			th.appendChild(document.createTextNode(colConfig.name));
			th.key = colConfig.key;
			
			return th;
		}
		
		return  fm;
	});
	
	return f;
});