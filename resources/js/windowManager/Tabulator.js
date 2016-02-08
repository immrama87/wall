define("windowManager/Tabulator", ["windowManager/Tabulator/formatter", "windowManager/Tabulator/data"], function(formatter, dataManager){
	var t = {};
	
	t.create = function(table, config){
		return new Tabulator(table, config);
	}
	
	var Tabulator = (function(table, config){
		var tb = {};
		
		var format = formatter.getFormatter(table, config);
		format.initFormat();
		
		var manager = dataManager.getManager(table, config);
		
		
		return tb;
	});
	
	return t;
});