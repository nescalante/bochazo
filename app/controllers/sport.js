'use strict';

var Sport = require('../model/sport'),
    async = require('async');

exports.list = function (callback) {
    Sport.find({}, callback);
};

Sport.find({}, function (err, data) {
    if (data.length == 0) {
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
})