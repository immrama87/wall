define("windowManager/Tabulator/data", [], function(){
	var d = {};
	
	d.getManager = function(table, config){
		return new Manager(table, config);
	}
	
	var Manager = (function(table, config){
		var m = {};
		
		m.init = function(){
			
		}
		
		return m;
	});
	
	return d;
});