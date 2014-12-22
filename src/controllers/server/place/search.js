'use strict';

var services = require('../../../domain/services');

module.exports = function (req, res, next) {
  res.viewModel = {
    model: {}
  };

  next();
};
