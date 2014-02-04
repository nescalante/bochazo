'use strict';

var Place = require('../model/place'),
	Sport = require('../model/sport'),
	async = require('async');

exports.get = function (name, callback) {
	return Place.findOne({ name: name }, callback);
};

exports.list = function (params, callback) {
	params = params || {};

	var skip = params.skip || 0,
		limit = params.limit || 10;

	async.parallel([
		function (task) {
			getListByQuery(params)
				.skip(skip)
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
    var permalink = model.description
    	.replace(/\s/g, '')
    	.replace(/\W/g, '');

    model.name = permalink;

	new Place(model).save(callback);
};

exports.count = function (model, callback) {
	new Place.count(callback);
};

function getListByQuery(params) {
	var query = Place.find({});

	if (params.sport) {
		query = query.where('courts.sport', params.sport.getAIRegex());
	}
	
	if (params.query) {
		var term = (params.query || '').getAIRegex();

		query = query
			.or([
				{ 'name': { $regex: term } },
				{ 'description': { $regex: term } },
				{ 'phones': { $regex: term } },
				{ 'address': { $regex: term } },
				{ 'addressComponents.longName': { $regex: term } },
				{ 'tags': { $regex: term } },
				{ 'courts.sport': { $regex: term } },
				{ 'courts.surface': { $regex: term } }
			]);
	}

	if (params.locations)
	{
		query = query.in('addressComponents.longName', createRegexArray(params.locations));
	}

	if (params.tags)
	{
		query = query.in('tags', createRegexArray(params.tags));
	}

	if (params.players)
	{
		query = query.in('courts.players', createArray(params.players));
	}

	if (params.surfaces)
	{
		query = query.in('courts.surface', createRegexArray(params.surfaces));
	}

	if (params.latitude && params.longitude) {
		query = query
			.where('location')
			.near({
				center: [params.latitude, params.longitude]
			});
	}

	return query;
}

function createRegexArray(param) {
	if (!(param instanceof Array))
	{
		param = [param];
	}

	return param.map(function (l) { 
		return l.getAIRegex();
	});
}

function createArray(param) {
	if (!(param instanceof Array))
	{
		param = [param];
	}

	return param;
}