'use strict';

var services = require('../../../domain/services');
var va = require('very-array');

module.exports = function (req, res, next) {
  services.place.get(req.params.id, function (err, result) {
    res.viewModel = {
      model: result
    };

    next();
  });
};
