'use strict';

var url = require('url'),
	service = require('../service');

exports.get = function(req, res) {
	var qs = url.parse(req.url, true).query;

	if (qs && qs.name) {
		service.place.get(qs.name, function (err, result) {
			if (err) {
				res.json(500, err);
			}
			else {
				res.json(result);
			}
		});
	}
	else {
		res.json(404, { message: 'some error message' });
	}
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

		res.json({ status: 'OK' });
	});
};
