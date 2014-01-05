'use strict';

var mongoose = require('mongoose'),
    court = require('./schema/court'),
    schema = new mongoose.Schema({
        name: { type: String, required: true, trim: true },
        info: { type: String, trim: true },
        addressComponents: [{
            longName: { type: String },
            shortName: { type: String },
            types: [{ type: String }]
        }],
        address: { type: String, trim: true },
        geometry: {
            lat: { type: Number },
            lng: { type: Number }
        },
        phone: { type: String, trim: true },
        howToArrive: { type: String, trim: true },
        courts: [court],
        tags: [{ type: String }],
        dateFrom: { type: Date, require: true, default: Date.now },
        isActive: { type: Boolean, require: true, default: true }
    }, { toObject: { getters: true }, toJSON: { getters: true } });

module.exports = mongoose.model('place', schema);