'use strict';

var async = require('async');
var Sport = require('../models').Sport;

module.exports = {
  list: list
};

Sport.find({}, function (err, data) {
  if (!data.length) {
    new Sport({
      name: 'Fútbol',
      icon: 'glyphicons_329_soccer_ball.png',
      allowPlayers: true,
      allowedPlayers: [5, 6, 7, 8, 9, 11],
      surfaces: ['Césped sintético', 'Caucho', 'Parquet', 'Baldosa', 'Cemento', 'Piso flotante', 'Césped natural', 'Tierra']
    }).save();

    new Sport({
      name: 'Tenis',
      icon: 'glyphicons_314_table_tennis.png',
      surfaces: ['Césped natural', 'Polvo de ladrillo', 'Baldosa']
    }).save();

    new Sport({
      name: 'Paddle',
      icon: 'glyphicons_314_table_tennis.png',
      surfaces: ['Baldosa']
    }).save();

    console.log('Initial sport data added.');
  }
});

function list(callback) {
  var result = [];

  Sport.find({}, parseCallback(callback, result));

  return result;
};

function parseCallback(callback, result) {
  return function (err, data) {
    if (!err) {
      [].push.apply(result, data);
    }

    if (callback) {
      callback(err, data);
    }
  }
}
