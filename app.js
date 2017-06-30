var express = require('express');
var app = express();
var exphbs = require('express-handlebars');
var request = require('request');
var async = require('async');
app.engine('handlebars', exphbs({defaultLayout: 'main'}));

app.set('view engine', 'handlebars');

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/search', function(req,res) {
	var data = {};
	var api_key = ;
	summoner = req.query.summoner.toLowerCase();

	async.waterfall([
		// call to get user's summonerID
		function(callback) {
			var URL = 'https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/' + summoner + '?api_key=' + api_key;
			request(URL, function(err, response, body) {
				if(!err && response.statusCode == 200) {
					var json = JSON.parse(body);
					data.id = json.id;
					//console.log(json.id);
					data.name = json.name;
					callback(null, data);
				} else {
					res.render('index', {incorrect: "Summoner not found"})
				}
			});
		},
		// get user's rank information
		function(data, callback) {
			var URL = 'https://na1.api.riotgames.com/lol/league/v3/positions/by-summoner/' + data.id + '?api_key=' + api_key;
			request(URL, function(err, response, body) {
				if(!err && response.statusCode == 200) {
					var json = JSON.parse(body);
					//console.log(json);
					for(var i = 0; i < 2; i++) {
						data["tier" + i] = (json[i] != null) ? json[i].tier : "N/A";
						data["rank" + i] = (json[i] != null) ? json[i].rank : "N/A";
						data["lp" + i] = (json[i] != null) ? json[i].leaguePoints : "N/A";
					}
					callback(null, data);
				} else {
					console.log(err);
				}
			});
		},
		// get info about user's highest mastery champion
		function(data, callback) {
			var URL = 'https://na1.api.riotgames.com/lol/champion-mastery/v3/champion-masteries/by-summoner/' + data.id +'?api_key=' + api_key;
			request(URL, function(err, response, body) {
				if(!err && response.statusCode == 200) {
					var json = JSON.parse(body);
					for(var i = 0; i < 1; i++) {
						if(json[i] != null) {
							data["mostPlayedChampId" + i] = json[i].championId;
							data["championLevel" + i] = json[i].championLevel;
							data["championPoints" + i] = json[i].championPoints;
						} else {
							data["mostPlayedChampId" + i] = "N/A";
							data["championLevel" + i] = "N/A";
							data["championPoints" + i] = "N/A";
							data.mostPlayedChampName0 = "N/A";
						}
					}
					callback(null, data);
				} else {
					console.log(err);
				}
			});
		},
		// get the name of the champion
		function(data, callback) {
			var URL = 'https://na1.api.riotgames.com/lol/static-data/v3/champions/' + data.mostPlayedChampId0 + '?locale=en_US&api_key=' + api_key;
			request(URL, function(err, response, body) {
				if(!err && response.statusCode == 200) {
					var json = JSON.parse(body);
					data.mostPlayedChampName0 = json.name;
					callback(null, data);
				} else {
					callback(null, data);
				}
			});
		},
	],
	function(err, data) {
		if(err) {
			console.log(err);
			return;
		}

		res.render('result',{
			info: data
		});
	});
});
var port = Number(process.env.PORT || 3000);

app.listen(port);
