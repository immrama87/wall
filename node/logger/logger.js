var fs = require("fs");

module.exports = function(){
	var l = {};
	var config = JSON.parse(fs.readFileSync("./logger/config.json", {encoding:'utf8', flag:'r'}));
	
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var months_long = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	
	var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var days_long = [
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	];
	
	var levels = ["all", "debug", "error", "fatal", "warn", "info", "trace", "off"];
	
	var Logger = function(className, file){
		var lg = {};
		
		lg.debug = function(message){
			if(levels.indexOf(config[file].level) <= levels.indexOf("debug")){
				writeMessage(message, "DEBUG");
			}
		}
		
		lg.error = function(message){
			if(levels.indexOf(config[file].level) <= levels.indexOf("error")){
				writeMessage(message, "ERROR");
			}
		}
		
		lg.fatal = function(message){
			if(levels.indexOf(config[file].level) <= levels.indexOf("fatal")){
				writeMessage(message, "FATAL");
			}
		}
		
		lg.warn = function(message){
			if(levels.indexOf(config[file].level) <= levels.indexOf("warn")){
				writeMessage(message, "WARN");
			}
		}
		
		lg.info = function(message){
			if(levels.indexOf(config[file].level) <= levels.indexOf("info")){
				writeMessage(message, "INFO");
			}
		}
		
		lg.trace = function(message){
			if(levels.indexOf(config[file].level) <= levels.indexOf("trace")){
				writeMessage(message, "TRACE");
			}
		}
		
		function writeMessage(message, level){
			var text = config[file].pattern;
			var date = new Date();
			if(text.indexOf("%dt") > - 1){
				var re = new RegExp("%dt", 'g');
				text = text.replace(re, formatDateTime(date)); 
			}
			if(text.indexOf("%d") > -1){
				var re = new RegExp("%d", 'g');
				text = text.replace(re, formatDate(date));
			}
			if(text.indexOf("%l") > -1){
				var re = new RegExp("%l", 'g');
				text = text.replace(re, level);
			}
			if(text.indexOf("%c") > -1){
				var re = new RegExp("%c", 'g');
				text = text.replace(re, className);
			}
			if(text.indexOf("%m") > -1){
				var re = new RegExp("%m", 'g');
				text = text.replace(re, message);
			}
			
			writeFile(text);
		}
			
		function writeFile(text){
			var fileName = config[file].file;
			var filePath = fileName.substring(0, fileName.lastIndexOf("/"));
			
			fs.stat("./" + filePath, function(err, stat){
				if(!err && stat.isDirectory()){
					fs.stat("./" + fileName, function(err, fstat){
						if(!err && fstat.isFile()){
							fileWriter = fs.createWriteStream("./" + fileName, {
								flags: "a",
								defaultEncoding: "utf8"
							});
							
							fileWriter.write(text + "\r");
							fileWriter.end();
						}
						else if(err.code == "ENOENT"){
							fs.open("./" + fileName, "w", function(err, fd){
								if(err)
									throw "Could not initialize the file ./" + fileName + " for logging. Application shutting down.";
									
								fs.close(fd, function(err){
									if(err)
										console.log(err);
										
									writeFile(text);
								});
							});
						}
					});
				}
				else if(err.code == "ENOENT"){
					fs.mkdir("./" + filePath, function(err, dir){
						if(err)
							throw "Could not initialize the directory ./" + filePath + " for logging. Application shutting down.";
						
						writeFile(text);
					});
				}
				else {
					
				}
			});
		}
		
		function verifyFile(){
			
		}
		
		function formatDate(date){
			var dateFormat = "MM/dd/yyyy";
			if(config.hasOwnProperty("date-format")){
				dateFormat = config["date-format"];
			}
			
			//Month
			if(dateFormat.indexOf("MMMM") > -1){
				dateFormat = dateFormat.replace("MMMM", months_long[date.getMonth()]);
			}
			if(dateFormat.indexOf("MMM") > -1){
				dateFormat = dateFormat.replace("MMM", months[date.getMonth()]);
			}
			if(dateFormat.indexOf("MM") > -1){
				dateFormat = dateFormat.replace("MM", lPad(date.getMonth() + 1, 2, "0"));
			}
			if(dateFormat.indexOf("M") > -1){
				dateFormat = dateFormat.replace("M", date.getMonth() + 1);
			}
			
			//Day
			if(dateFormat.indexOf("dd") > -1){
				dateFormat = dateFormat.replace("dd", lPad(date.getDate(), 2, "0"));
			}
			if(dateFormat.indexOf("d") > -1){
				dateFormat = dateFormat.replace("d", date.getDate());
			}
			if(dateFormat.indexOf("uu") > -1){
				dateFormat = dateFormat.replace("uu", days_long[date.getDay()]);
			}
			if(dateFormat.indexOf("u") > -1){
				dateFormat = dateFormat.replace("u", days[date.getDay()]);
			}
			
			//Year
			if(dateFormat.indexOf("yyyy") > -1){
				dateFormat = dateFormat.replace("yyyy", date.getFullYear());
			}
			if(dateFormat.indexOf("yy") > -1){
				dateFormat = dateFormat.replace("yy", date.getFullYear().substring(2));
			}
			
			return dateFormat;
		}
		
		function formatDateTime(date){
			var dateTimeFormat = "MM/dd/yyyy hh:mm:ss a";
			if(config.hasOwnProperty("date-time-format")){
				dateTimeFormat = config["date-time-format"];
			}
			var ampm = "AM";
			var h = date.getHours();
			if(h >= 12){
				h -= 12;
				ampm = "PM";
			}
			if(h == 0){
				h = 12;
			}
			
			//Month
			if(dateTimeFormat.indexOf("MMMM") > -1){
				dateTimeFormat = dateTimeFormat.replace("MMMM", months_long[date.getMonth()]);
			}
			if(dateTimeFormat.indexOf("MMM") > -1){
				dateTimeFormat = dateTimeFormat.replace("MMM", months[date.getMonth()]);
			}
			if(dateTimeFormat.indexOf("MM") > -1){
				dateTimeFormat = dateTimeFormat.replace("MM", lPad(date.getMonth() + 1, 2, "0"));
			}
			if(dateTimeFormat.indexOf("M") > -1){
				dateTimeFormat = dateTimeFormat.replace("M", date.getMonth() + 1);
			}
			
			//Day
			if(dateTimeFormat.indexOf("dd") > -1){
				dateTimeFormat = dateTimeFormat.replace("dd", lPad(date.getDate(), 2, "0"));
			}
			if(dateTimeFormat.indexOf("d") > -1){
				dateTimeFormat = dateTimeFormat.replace("d", date.getDate());
			}
			if(dateTimeFormat.indexOf("uu") > -1){
				dateTimeFormat = dateTimeFormat.replace("uu", days_long[date.getDay()]);
			}
			if(dateTimeFormat.indexOf("u") > -1){
				dateTimeFormat = dateTimeFormat.replace("u", days[date.getDay()]);
			}
			
			//Year
			if(dateTimeFormat.indexOf("yyyy") > -1){
				dateTimeFormat = dateTimeFormat.replace("yyyy", date.getFullYear());
			}
			if(dateTimeFormat.indexOf("yy") > -1){
				dateTimeFormat = dateTimeFormat.replace("yy", date.getFullYear().substring(2));
			}
			
			//Hour
			if(dateTimeFormat.indexOf("hh") > -1){
				dateTimeFormat = dateTimeFormat.replace("hh", lPad(h, 2, "0"));
			}
			if(dateTimeFormat.indexOf("h") > -1){
				dateTimeFormat = dateTimeFormat.replace("h", h);
			}
			
			//Minute
			if(dateTimeFormat.indexOf("mm") > -1){
				dateTimeFormat = dateTimeFormat.replace("mm", lPad(date.getMinutes(), 2, "0"));
			}
			if(dateTimeFormat.indexOf("m") > -1){
				dateTimeFormat = dateTimeFormat.replace("m", date.getMinutes());
			}
			
			//Seconds
			if(dateTimeFormat.indexOf("ss") > -1){
				dateTimeFormat = dateTimeFormat.replace("ss", lPad(date.getSeconds(), 2, "0"));
			}
			if(dateTimeFormat.indexOf("s") > -1){
				dateTimeFormat = dateTimeFormat.replace("s", date.getSeconds());
			}
			
			//AM-PM Indicator
			if(dateTimeFormat.indexOf("a") > -1){
				dateTimeFormat = dateTimeFormat.replace("a", ampm);
			}
			
			return dateTimeFormat;
		}
		
		return lg;
	}
	
	function lPad(str, len, ch){
		str = str.toString();
		
		while(str.length < len){
			str = ch + str;
		}
		
		return str;
	}
	
	l.getInstance = function(className, file){
		return new Logger(className, file);
	}
	
	return l;
}