var Rooster = require("./index.js");
var rooster = new Rooster();

// rooster.getLastEdit(function(date){
// 	console.log("Last edit at:");
// 	console.log(date);
// 	console.log(" ");
// });
// rooster.getTabs(function(tabs){
// 	console.log("Tabs available:");
// 	console.log(tabs);
// 	console.log("Params of tab:");
// 	console.log(rooster.params(tabs[0].url));
// });
// rooster.getGroups(function(groups){
// 	console.log("Groups:");
// 	console.log(groups);
// });
// rooster.getNotes(true, function(data){
// 	console.log(data);
// });

var url = rooster.getUrl({
	type: "Leerlingrooster",
	school: 507,
	afdeling: "vwo-5",
	leerling: "120003525",
	wijzigingen: 1
});
rooster.getTitle(url, function(title){
	console.log(title);
});
rooster.getName(url, function(title){
	var name = rooster.stripName(title);
	console.log(name);
});
rooster.getSchedule(url, function(data){
	if(data.length == 5){
		console.log("Succes.");
	}
});
rooster.getSchedule("http://roosters5.gepro-osi.nl/roosters/rooster.php?wijzigingen=1&klassen%5B%5D=RH1A&type=Klasrooster&tabblad=1&school=1263", function(data){
	console.log(data[0][0]);
});