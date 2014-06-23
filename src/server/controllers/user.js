'use strict';

var User = require('../models/user');

exports.login = function (profile, done) {
    User.findOne({ _id: email }, function (err, user) {
        if (err) {
            done(err, null);
            
            return;
        }

        if (!user) {
            new User({ 
                _id: profile.email,
                email: profile.email,
                displayName: profile.displayName,
                identifier: profile.identifier
            }).save(done);
        }

        if (user) {
            done(null, user);
        }
    });
};