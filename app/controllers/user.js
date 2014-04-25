'use strict';

var User = require('../models/user');

exports.login = function (profile, done) {
    var email = profile.emails[0].value;

    User.findOne({ _id: email }, function (err, user) {
        if (err) {
            done(err, null);
            
            return;
        }

        if (!user) {
            new User({ 
                _id: email,
                email: email,
                displayName: profile.displayName,
                identifier: profile.identifier
            }).save(done);
        }

        if (user) {
            done(null, user);
        }
    });
};