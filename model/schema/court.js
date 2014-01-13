'use strict';

var mongoose = require('mongoose'),
    schema = new mongoose.Schema({
        name: { type: String, trim: true },
        players: { type: Number },
        isIndoor: { type: Boolean },
        isLighted: { type: Boolean },
        type: { type: String, require: true, trim: true },
        floor: { type: String, require: true, trim: true },
        isActive: { type: Boolean, require: true, default: true }
    }, { toObject: { getters: true }, toJSON: { getters: true } });

module.exports = schema;