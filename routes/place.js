'use strict';

var url = require('url'),
	service = require('../service');

exports.get = function(req, res) {
	var qs = url.parse(req.url, true).query;

	if (qs && qs.name) {
		res.json({ sample: qs.name });
	}
	
	res.json({ sample: 'some string' });
};

exports.list = function(req, res) {
	service.place.list(function (err, result) {
		if (err) {
			res.json(500, err);
		}
		else {
			res.json({
				list: result.list,
				count: result.count
			});
		}
	});
};

exports.insert = function(req, res) {
	service.place.insert(req.body, function (err) {
		if (err) {
			res.json(500, err);
		}
	});
};
