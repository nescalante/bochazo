'use strict';

var services = require('../../../domain/services');
var url = require('url');
var va = require('very-array');
var qs = require('querystring');
var _ = require('lodash');

module.exports = function (req, res, next) {
  var query = _.merge({ sport: req.param('sport') }, req.query);

  services.place.list(query, function (err, result) {
    if (err) {
      throw err;
    }

    result.list.forEach(function (i) {
      i.summary = i.courts && getSummary(i.courts);
    });

    result.params = query || {};
    result.params.sport = result.params.sport || req.param('sport');
    result.params.next = qs.stringify(_.merge(result.params, { skip: (+result.params.skip || 0) + (+result.params.take || 10) }));
    result.params.url = qs.stringify(_.omit(result.params, ['skip', 'take', 'next']));
    result.params.skip = result.params.skip || 0;

    ['surfaces', 'players', 'locations', 'tags'].forEach(function (item) {
      if (typeof(result.params[item]) == 'string') {
        result.params[item] = [result.params[item]];
      }
    });

    result.hasParams = !!(result.params.query ||
      (result.params.surfaces && result.params.surfaces.length) ||
      (result.params.players && result.params.players.length) ||
      (result.params.locations && result.params.locations.length) ||
      (result.params.tags && result.params.tags.length));
    result.sports = global.sports;

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
