'use strict';

var service = require('../service'),
	express = require('express'),
	place = require('./place'),
	sport = require('./sport'),
	partial = require('./partial'),
	authentication = require('./authentication');

module.exports = exports = function (app) {
	// root source
	app.get('/', function(req, res) {
		res.render('index', { title: 'BCHZ' });
	});

	// partial views
	app.get('/:partial/:name.html', partial.get);

	// api reference
	app.get('/api/place/get/:name', place.get);
	app.get('/api/place/list', place.list);
	app.post('/api/place', place.save);
	app.get('/api/sport/list', sport.list);

	authentication(app);
};