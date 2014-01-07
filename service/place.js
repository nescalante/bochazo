'use strict';

var Place = require('../model/place'),
	async = require('async');

exports.get = function (name, callback) {
	return Place.findOne({ name: name }, callback);
};

exports.list = function (callback) {
	async.parallel([
		function (task) {
			Place.find(function (err, data) {
				task(null, { 
					err: err, 
					data: data 
				});
			});
		}, 
		function (task) {
			Place.count(function (err, data) {
				task(null, {
					err: err, 
					data: data 
				});
			});
		}
	], function (err, results) {
		err = err || results[0].err || results[1].err;

		if (err) {
			callback(err, {
				err: err
			});
		}
		else {
			callback(null, {
				list: results[0].data,
				count: results[1].data
			});
		}
	});
};

exports.insert = function (model, callback) {
	new Place(model).save(callback);
};

exports.count = function (model, callback) {
	new Place.count(callback);
};