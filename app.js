'use strict';

var express = require('express'),
	http = require('http'),
	path = require('path'),
	app = express(),
	routes = require('./routes');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.session({ secret: 'sarasa' }));
app.use(app.router);

app.use(function(err, req, res, next) {
  console.error(err);
  res.send(500, err);
});

// public folders
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/components', express.static(path.join(__dirname, 'bower_components')));


routes(app);

http.createServer(app).listen(app.get('port'), function() {
	console.log('Running on port ' + app.get('port'));
});