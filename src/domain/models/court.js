'use strict';

var mongoose = require('mongoose');
var schema = require('./schema/court');

module.exports = mongoose.model('court', schema);
