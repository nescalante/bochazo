'use strict';

var Place = require('../model/place'),
	async = require('async');

exports.get = function (name, callback) {
	return Place.findOne({ name: name }, callback);
};

exports.list = function (params, callback) {
	params = params || {};

	var init = params.init || 0,
		limit = params.limit || 3;

	async.parallel([
		function (task) {
			getListByQuery(params)
				.skip(init)
				.limit(limit)
				.exec(function (err, data) {
					task(null, { 
						err: err, 
						data: data 
					});
				});
		}, 
		function (task) {
			getListByQuery(params)
				.count(function (err, data) {
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

function getListByQuery(params) {
	var term = new RegExp(params.query || '', 'i');

	return Place.find()
		.or([
			{ 'name': { $regex: term } },
			{ 'description': { $regex: term } },
			{ 'phone': { $regex: term } },
			{ 'address': { $regex: term } },
			{ 'addressComponents.longName': { $regex: term } },
			{ 'tags': { $regex: term } },
			{ 'courts.type': { $regex: term } },
			{ 'courts.floor': { $regex: term } }
		]);
}