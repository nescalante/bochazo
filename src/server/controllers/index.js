'use strict';

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/bchz',
    place = require('./place'),
    sport = require('./sport'),
    mongoose = require('mongoose');

mongoose.connect(mongoUri, function (err) {
    if (err) {
        console.log('Failed to initialize mongo server at: ' + mongoUri);

        throw err;
    }
    else {
        console.log('Connected to: ' + mongoUri);
    }
});

exports.place = place;
exports.sport = sport;