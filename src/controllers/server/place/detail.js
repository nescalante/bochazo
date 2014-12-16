'use strict';

var services = require('../../../domain/services');
var va = require('very-array');

module.exports = function (req, res, next) {
  services.place.get(req.params.id, function (err, result) {
    result.summary = getSummary(result.courts);

    res.viewModel = {
      model: result
    };

    next();
  });
};

function getSummary(courts) {
  return va(courts)
    .groupBy(function (c) {
        return {
            sport: c.sport,
            players: c.players,
            surface: c.surface,
            isIndoor: c.isIndoor
        };
    })
    .groupBy(function (c) { return c.key.sport; })
    .orderBy(function (c) { return c.key; })
    .select(function (c) {
        c.count = c.sum(function (i) { return i.length; });

        return c;
    });
}
