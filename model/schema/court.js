'use strict';

var mongoose = require('mongoose'),
    schema = new mongoose.Schema({
        name: { type: String, required: true, trim: true },
        players: { type: Number },
        isIndoor: { type: Boolean },
        isLighted: { type: Boolean },
        courtType: { type: String, require: true, trim: true },
        floorType: { type: String, require: true, trim: true },
        isActive: { type: Boolean, require: true, default: true }
    }, { toObject: { getters: true }, toJSON: { getters: true } });

module.exports = schema;