'use strict';

var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var services = require('../domain/services');
var realm = 'http://localhost:3000/' || process.env.REALM;

module.exports = function (app) {
  return; // no authentication yet

  passport.use(new GoogleStrategy({
    returnURL: realm + 'auth/google/return',
    realm: realm
  }, services.authentication.googleLogin));

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
