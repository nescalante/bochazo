'use strict';

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/bchz';
var place = require('./place.js');
var sport = require('./sport.js');
var authentication = ('./authentication.js');
var mongoose = require('mongoose');

mongoose.connect(mongoUri, function (err) {
  if (err) {
    console.log('Failed to initialize mongo server at: ' + mongoUri);

    throw err;
  }
  else {
    console.log('Connected to: ' + mongoUri);
  }
});

module.exports = {
  place: place,
  sport: sport,
  authentication: authentication
};
