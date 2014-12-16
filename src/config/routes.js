'use strict';

var api = require('../domain/api');

module.exports = function (app) {
  // authentication
  app.get('/logout', api.authentication.logout);
  app.get('/auth/google', api.authentication.googleAuthenticate);
  app.get('/auth/google/return', api.authentication.googleAuthenticate, api.authentication.loggedIn);

  // api reference
  app.get('/api/place/get/:id', api.place.get);
  app.get('/api/place/list', api.place.list);
  app.post('/api/place', api.place.save);
  app.get('/api/sport/list', api.sport.list);

  app.get('/api/*', function(req, res) {
    res.json({ message: 'Action not found.' }, 404);
  });
};
