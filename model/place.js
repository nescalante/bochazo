'use strict';

var mongoose = require('mongoose'),
	court = require('./schema/court'),
	va = require('very-array'),
	schema = new mongoose.Schema({
		_id: { type: String, required: true, trim: true },
		description: { type: String, required: true, trim: true },
		info: { type: String, trim: true },
		addressComponents: [{
			longName: { type: String },
			shortName: { type: String },
			types: [{ type: String }]
		}],
		address: { type: String, trim: true },
		location: { type: [Number], index: '2d', required: true },
		phones: [{ type: String, trim: true }],
		howToArrive: { type: String, trim: true },
		courts: [court],
		tags: [{ type: String }],
		dateFrom: { type: Date, require: true, default: Date.now },
		isActive: { type: Boolean, require: true, default: true }
	}, { toObject: { getters: true }, toJSON: { getters: true }, id: false });

schema
	.virtual('latitude')
	.get(function () {
		return this.location[0];
	})
	.set(function (latitude) {
		if (!this.location || this.location.length == 0) {
			this.location = [0, 0];
		}

		this.location[0] = latitude;
	});

schema
	.virtual('longitude')
	.get(function () {
		return this.location[1];
	})
	.set(function (longitude) {
		if (!this.location || this.location.length == 0) {
			this.location = [0, 0];
		}

		this.location[1] = longitude;
	});

module.exports = mongoose.model('place', schema);