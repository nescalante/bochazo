'use strict';

var service = require('../service');

exports.index = function(req, res) {
  res.render('index', { title: 'Express' });
};