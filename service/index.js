'use strict';

var place = require('./place'),
	mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');

exports.place = place;