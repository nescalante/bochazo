'use strict';

var url = require('url'),
	service = require('../service');

exports.list = function(req, res) {
	service.sport.list(function (err, result) {
		if (err) {
			res.json(500, err);
		}
		else {
			res.json(result);
		}
	});
};