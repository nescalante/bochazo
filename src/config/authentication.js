'use strict';

var passport = require('passport'),
    GoogleStrategy = require('passport-google').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    routes = require('../routes'),
    realm = 'http://localhost:3000/' || process.env.REALM;

module.exports = function (app) {
  return;
    passport.use(new GoogleStrategy({
        returnURL: realm + 'auth/google/return',
        realm: realm
    }, routes.authentication.googleLogin));

    app.post('/login',
        passport.authenticate('local'),
        function (req, res) {
            res.json(req.user);
        });

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    app.use(passport.initialize());
    app.use(passport.session());
};
