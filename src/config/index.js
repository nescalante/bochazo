'use strict';

var express = require('express');
var app = express();
var _ = require('lodash');
var taunus = require('taunus');
var taunusExpress = require('taunus-express');
var jade = require('jade');
var path = require('path');
var serveStatic = require('serve-static');
var services = require('../domain/services');

global.sports = services.sport.list();

var layoutModel = {
  title: 'TGHOUNUS',
  sports: global.sports
};

taunusExpress(taunus, app, {
  routes: require('../routes.js'),
  layout: jade.compileFile('./src/views/layout.jade'),
  getDefaultViewModel: function (done) {
    done(null, layoutModel);
  },
  getPartial: function (action, model, done) {
    var file = path.join('./src/views', action + '.jade');
    var html = jade.renderFile(file, model);

    done(null, html);
  }
});

require('./routes.js')(app);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('title', process.env.TITLE || 'BCHZ');

app.use(serveStatic('public'));
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.cookieSession({ secret: process.env.secret || 'bochi-secret', cookie: { maxAge: 60 * 60 * 1000 }}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

// production environment
if ('development' != app.get('env')) {
    app.set('json spaces', 0);
}

// set authentication
require('./authentication.js')(app);

// error handling
app.use(function(req, res, next) {
    res.status(404);

    if (req.accepts('html')) {
        res.render('layout', app.get('title'));
        return;
    }

    if (req.accepts('json')) {
        res.send({ message: 'Resource not found' });
        return;
    }

    res.type('txt').send('Not found');
});

module.exports = app;
