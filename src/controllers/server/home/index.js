'use strict';

var service = require('../../../server/controllers')

module.exports = function (req, res, next) {
  service.sport.list(function (err, result) {
    if (err) {
      res.json(500, err);
      return;
    }

    res.viewModel = {
      model: {
        sports: result
      }
    };

    console.log(res);
    next();
  });
};
