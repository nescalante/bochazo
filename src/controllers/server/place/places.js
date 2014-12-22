'use strict';

var services = require('../../../domain/services');
var va = require('very-array');

module.exports = function (req, res, next) {
  var query = req.query;

  services.place.list(query, function (err, result) {
    if (err) {
      throw err;
    }

    result.list.forEach(function (i) {
      i.summary = i.courts && getSummary(i.courts);
    });

    res.viewModel = {
      model: result
    };

    next();
  });
};

function getSummary(courts) {
  return va(courts)
    .groupBy(function (c) { return c.sport; })
    .orderBy(function (c) { return c.key; });
}
