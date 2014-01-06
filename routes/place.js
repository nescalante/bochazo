'use strict';

var url = require('url'),
	service = require('../service')

exports.get = function(req, res) {
	res.jsonp({ sample: 'some string' });
};

exports.list = function(req, res) {
	var qs = url.parse(req.url, true).query;

	if (qs && qs.name) {
		res.jsonp({ sample: qs.name });
	}
	else {
		var list = service.place.get();

		res.json(list);
	}
};

exports.list = function(req, res) {
	var qs = url.parse(req.url, true).query;

	if (qs && qs.name) {
		res.jsonp({ sample: qs.name });
	}
	else {
		service.place.get()
			.find(function (err, places) {
	    		res.json({
	    			list: places,
	    			count: 0
	    		});
			});
	}
};

exports.insert = function(req, res) {
	console.log(req.body);
};
