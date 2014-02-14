'use strict';

var mongoose = require('mongoose'),
	schema = new mongoose.Schema({
		name: { type: String, trim: true },
		players: { type: Number },
		isIndoor: { type: Boolean },
		isLighted: { type: Boolean },
		sport: { type: String, require: true, trim: true },
		surface: { type: String, require: true, trim: true },
		isActive: { type: Boolean, require: true, default: true }
	}, { toObject: { getters: true }, toJSON: { getters: true }, id: false });

module.exports = schema;