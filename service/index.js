'use strict';

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/test',
  	place = require('./place'),
	mongoose = require('mongoose');

mongoose.connect(mongoUri);

exports.place = place;