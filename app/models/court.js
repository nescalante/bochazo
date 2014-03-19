'use strict';

var mongoose = require('mongoose'),
    schema = require('./schema/court');

module.exports = mongoose.model('court', schema);