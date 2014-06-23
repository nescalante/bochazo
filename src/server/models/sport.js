'use strict';

var mongoose = require('mongoose'),
    latinize = require('latinize'),
    schema = new mongoose.Schema({
        name: { type: String, required: true, trim: true },
        icon: { type: String, required: true, trim: true },
        allowPlayers: { type: Boolean, required: true, default: false },
        allowedPlayers: [{ type: Number }],
        surfaces: [{ type: String }],
        customConfigurations: [{
            name: { type: String, trim: true, required: true },
            values: [{ type: String }]
        }],
        isActive: { type: Boolean, require: true, default: true }
    }, { toObject: { getters: true }, toJSON: { getters: true } });

schema.virtual('url').get(function () {
    return latinize(this.name).toLowerCase();
});

module.exports = mongoose.model('sport', schema);