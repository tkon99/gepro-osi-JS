function Rooster(school, hours, cells){
	var request = require('request');
	var cheerio = require('cheerio');

	/* 
		Constructor Code
	*/
	var _school,
		_hours,
		_cells;
	if(school == undefined){
		_school = 507;
	}else{
		_school = school; //Which school to use
	}
	if(hours == undefined){
		_hours = 10;
	}else{
		_hours = hours; //Hours per day
	}
	if(cells == undefined){
		_cells = 6;
	}else{
		_cells = cells; //Cells per hour
	}

	/*
		General Purpose Code
	*/
	this.getUrl = function(obj){
		var str = [];
		for(var p in obj){
			if (obj.hasOwnProperty(p)) {
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
			}
		}
		return "http://roosters5.gepro-osi.nl/roosters/rooster.php?"+str.join("&");
	}

	this.get = function(url,callback){
		request(url, function (error, response, html) {
			if (!error && response.statusCode == 200) {
				callback(html);
			}else{
				callback(false);
			}
		});
	}

	this.params = function(url){
		var returnarray = {};
		url = url.split("?");
		if(url.length > 1){
			var params = url[1].split("&");
			for(i in params){
				var data = params[i].split("=");
				returnarray[data[0]] = data[1];
			}
		}
		return returnarray;
	}

	/*
		General Schedule Info
	*/
	this.getLastEdit = function(callback){
		var url = this.getUrl({school:_school});
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var text = $('font[class=fntprompt]').text().split(" ");
			var datum = text[text.length-2].split("-");
			var textDate = datum[2]+"-"+datum[1]+"-"+datum[0]+"T"+ text[text.length-1];
			var date = new Date(textDate.trim());
			callback(date);
		});
	}

	this.getTabs = function(callback){
		var url = this.getUrl({school:_school});
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var options = [];
			$(".fnttaboff").each(function(i, elem){
				options.push({
					name: $(this).text().trim(),
					url: "http://roosters5.gepro-osi.nl/roosters/"+$(this).attr("href")
				});
			});
			options.push({
				name: $(".fnttabon").text().trim(),
				url: url
			});
			callback(options);
		});
	}

	this.getGroups = function(callback){
		var url = this.getUrl({
			school:_school,
			type: "Klasrooster"
		});
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var options = [];
			$("option").each(function(i, elem){
				options.push($(this).text().trim());
			});
			callback(options);
		});
	}

	this.getTeachers = function(callback){
		var url = this.getUrl({
			school:_school,
			type: "Docentrooster"
		});
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var options = [];
			$("option").each(function(i, elem){
				options.push($(this).text().trim());
			});
			callback(options);
		});
	}

	this.getRooms = function(callback){
		var url = this.getUrl({
			school:_school,
			type: "Lokaalrooster"
		});
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var options = [];
			$("option").each(function(i, elem){
				options.push($(this).text().trim());
			});
			callback(options);
		});
	}

	this.getSections = function(callback){
		var url = this.getUrl({
			school:_school,
			type: "Leerlingrooster"
		});
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var options = [];
			$("option").each(function(i, elem){
				options.push($(this).text().trim());
			});
			callback(options);
		});
	}

	this.getNotes = function(convert, callback){
		var url = this.getUrl({
			school:_school
		});
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var data = $(".Remark").html().replace(/(<br>)+$/g, "");
			if(convert){
				data = data.replace(/(<br>)+/g, "\n");
			}
			callback(data);
		});
	}

	/*
		Student functions
	*/
	this.getStudents = function(section, callback){
		if(section == undefined){
			callback(false);
		}else{
			var url = this.getUrl({
				school:_school,
				afdeling:encodeURIComponent(section)
			});
			this.get(url, function(html){
				var $ = cheerio.load(html);
				var options = [];
				if($("option").length > 0){
					$("option").each(function(i, elem){
						var studentCode = $(this).attr("value");
						var studentName = $(this).text();
						options.push({
							name: studentName,
							code: studentCode
						});
					});
					callback(options);
				}else{
					//Disabled by school
					callback(false);
				}
			});
		}
	}

	/*
		Schedule functions
	*/
	//Don't blame me for this it looked nice in PHP and I decided to stick to it for my sanity's sake.
	this.getSchedule = function(url, callback){
		this.get(url, function(html){
			var $ = cheerio.load(html);
			var roostertable = $('tr .tableCell table');
			var table = [];
			for(x = 0; x < 5; x++){ //Five days a week
				table.push([]);
				for(i = x; i < _hours*5; i = i+5){
					var hour = Math.floor(i/5);
					var uur = $(roostertable).get(i);
					var data = $(uur).find('tr td');
					var hours = data.length/_cells;

					var temphour = [];

					for(var h = 1; h <= hours; h++){
						var maxIndex = h*_cells;

						var leraar = data.get(maxIndex - _cells);
						var lokaal = data.get(maxIndex - _cells + 2);
						var vak = data.get(maxIndex - _cells + 4);
						var cluster = data.get(maxIndex - _cells + 5);
						
						var hClass = $(leraar).attr("class");

						var status,
							status_txt;
						switch(hClass){
							case "tableCellNew":
								status_txt = 'wijziging';
								status = 1;
								break;
							case "tableCellRemoved":
								status_txt = "uitval";
								status = 2;
								break;
							default:
								status_txt = "normaal";
								status = 0;
						}

						temphour.push({
							vak: $(vak).text(),
							lokaal: $(lokaal).text(),
							leraar: $(leraar).text(),
							cluster: $(cluster).text(),
							status: {
								type: status,
								text: status_txt
							}
						});
					}
					table[x].push(temphour);
				}
			}
			callback(table);
		});
	}
	this.getTitle = function(url, callback){
		if(url == undefined){
			callback(false);
		}else{
			this.get(url, function(html){
				var $ = cheerio.load(html);
				callback($(".Header").text().trim());
			});
		}
	}
	this.getName = function(url, callback){
		if(url == undefined){
			callback(false);
		}else{
			this.get(url, function(html){
				var $ = cheerio.load(html);
				callback($(".lNameHeader").text().trim());
			});
		}
	}
	this.stripName = function(nameparts){
		nameparts = nameparts.split(" ");
		nameparts.pop();
		nameparts.shift();
		nameparts.pop();
		nameparts.shift();
		return nameparts.join(" ");
	}
}

module.exports = Rooster;