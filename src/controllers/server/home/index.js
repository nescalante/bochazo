'use strict';

var service = require('../../../domain/services')

module.exports = function (req, res, next) {
  var a = service.sport.list(function (err, result) {
    if (err) {
      res.json(500, err);
      return;
    }

    res.viewModel = {
      model: {
        sports: result,
        title: 'lalala'
      }
    };

    next();
  });
};
