'use strict';

var Place = require('../model/place');

exports.get = function () {
	return Place;
};

exports.insert = function (model) {
	new Place(model).save(function (err) {
		console.log(err);
	});
};