'use strict';

var routes = require('../routes');

module.exports = function (app) {
  var layoutConfig = {
    title: app.get('title'),
    year: new Date().getFullYear(),
    env: app.get('env')
  };

  // root source
  [
    '/',
    '/busqueda',
    '/listado',
    '/mapa',
    '/canchas/agregar',
    '/canchas/listado/:sport',
    '/canchas/listado',
    '/canchas/:id'
  ].forEach(function (route) {
    app.get(route, function (req, res) {
      res.render('layout', layoutConfig);
    });
  });

  // authentication
  app.get('/logout', routes.authentication.logout);
  app.get('/auth/google', routes.authentication.googleAuthenticate);
  app.get('/auth/google/return', routes.authentication.googleAuthenticate, routes.authentication.loggedIn);

  // partial views
  app.get('/:partial/:name.html', routes.partial.get);

  // api reference
  app.get('/api/place/get/:id', routes.place.get);
  app.get('/api/place/list', routes.place.list);
  app.post('/api/place', routes.place.save);
  app.get('/api/sport/list', routes.sport.list);

  app.get('/api/*', function(req, res) {
    res.json({ message: 'Action not found.' }, 404);
  });
};
