'use strict';

var mongoose = require('mongoose');
var schema = new mongoose.Schema({
		_id: { type: String, required: true, trim: true },
		displayName: { type: String, required: true, trim: true },
		identifier: { type: String, trim: true },
		roles: [{ type: String }]
	}, { toObject: { getters: true }, toJSON: { getters: true }, id: false });

module.exports = mongoose.model('user', schema);
