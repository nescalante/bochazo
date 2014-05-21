'use strict';

var express = require('express'),
    folders = require('./folders');

module.exports = function (app) {
    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('title', process.env.TITLE || 'BCHZ');
    app.set('views', folders.views);
    app.set('view engine', 'jade');

    app.use(express.favicon());
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

    // public folders
    if ('development' != app.get('env')) {
        app.use('/', express.static(folders.build));
    }
    else {
        app.use('/components', express.static(folders.components));
        app.use('/', express.static(folders.public));
    }

    // set authentication
    require('./authentication')(app);

    // initialize routes
    require('./routes')(app);

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
};