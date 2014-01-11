'use strict';

var service = require('../service');
var place = require('./place');
var partial = require('./partial');

exports.index = function(req, res) {
  res.render('index', { title: 'Express' });
};

exports.loggedIn = function(req, res) {
  res.render('index', { title: 'Logeado' });
};

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

exports.place = place;
exports.partial = partial;