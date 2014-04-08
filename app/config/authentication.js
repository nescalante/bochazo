'use strict';

var passport = require('passport'),
    GoogleStrategy = require('passport-google').Strategy;

module.exports = exports = function (app) {
    passport.use(new GoogleStrategy({
        returnURL: 'http://localhost:3000/auth/google/return',
        realm: 'http://localhost:3000/'
    }, function(identifier, profile, done) {
        profile.identifier = identifier;

        return done(null, profile);
        //User.findOrCreate({ openId: identifier }, function(err, user) {
        //  done(err, user);
        //});
    }));

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    app.use(passport.initialize());
    app.use(passport.session());
}