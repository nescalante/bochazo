'use strict';

var passport = require('passport'),
    GoogleStrategy = require('passport-google').Strategy;

module.exports = exports = function (app) {
    var loggedIn = function(req, res) {
            res.render('index', { title: 'Logeado' });
        },
        logout = function(req, res) {
            req.logout();
            res.redirect('/');
        };

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

    app.get('/logout', logout);
    app.get('/auth/google', passport.authenticate('google', { failureRedirect: '/' }));
    app.get('/auth/google/return', passport.authenticate('google', { failureRedirect: '/' }), loggedIn);

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login');
    }
}