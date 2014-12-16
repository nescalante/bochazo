'use strict';

var services = require('../../../domain/services');
var url = require('url');
var va = require('very-array');

module.exports = function (req, res, next) {
  var qs = url.parse(req.url, true).query;

  services.place.list(qs, function (err, result) {
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
