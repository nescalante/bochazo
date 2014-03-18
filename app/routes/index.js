'use strict';

var express = require('express'),
	service = require('../controllers'),
	place = require('./place'),
	sport = require('./sport'),
	partial = require('./partial'),
	authentication = require('./authentication');

module.exports = exports = function (app) {
	// root source
	app.get('/', manageResource('/site/home'));
	app.get('/busqueda', manageResource('/place/search'));
	app.get('/listado', manageResource('/place/list'));
	app.get('/mapa', manageResource('/site/map'));
	app.get('/canchas/agregar', manageResource('/place/add'));
	app.get('/canchas/listado/:sport', manageResource('/place/list'));
	app.get('/canchas/listado', manageResource('/place/list'));
	app.get('/canchas/:id', manageResource('/place/detail'));

	// partial views
	app.get('/:partial/:name.html', partial.get);

	// api reference
	app.get('/api/place/get/:id', place.get);
	app.get('/api/place/list', place.list);
	app.post('/api/place', place.save);
	app.get('/api/sport/list', sport.list);

	app.get('/api/*', function(req, res) {
	  	res.json({ message: 'Action not found.' }, 404);
	});

	authentication(app);

	function manageResource(resource) {
		return function (req, res) {
			res.render('layout', { title: 'BCHZ' });
		};
	}
};