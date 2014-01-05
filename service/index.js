'use strict';

var place = require('./place');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');

exports.place = place;