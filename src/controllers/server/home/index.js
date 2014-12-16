'use strict';

var services = require('../../../domain/services');

module.exports = function (req, res, next) {
  services.sport.list(function (err, result) {
    if (err) {
      throw err;
    }

    res.viewModel = {
      model: {
        sports: result
      }
    };

    next();
  });
};
