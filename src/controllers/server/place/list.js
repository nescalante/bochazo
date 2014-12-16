'use strict';

var services = require('../../../domain/services');
var url = require('url');
var va = require('very-array');
var qs = require('querystring');
var _ = require('lodash');

module.exports = function (req, res, next) {
  var query = url.parse(req.url, true).query;

  services.place.list(query, function (err, result) {
    if (err) {
      throw err;
    }

    result.list.forEach(function (i) {
      i.summary = i.courts && getSummary(i.courts);
    });

    result.params = query || {};
    result.params.next = qs.stringify(_.merge(result.params, { skip: (+result.params.skip || 0) + (+result.params.take || 10) }));
    result.params.url = qs.stringify(result.params);
    result.params.skip = result.params.skip || 0;

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
