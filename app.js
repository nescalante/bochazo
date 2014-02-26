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

// public folders
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/components', express.static(path.join(__dirname, 'bower_components')));

routes(app);

app.use(function(req, res, next) {
	res.status(404);

	if (req.accepts('html')) {
		res.render('index', { title: 'BCHZ' });
		return;
	}

	if (req.accepts('json')) {
		res.send({ message: 'Resource not found' });
		return;
	}

	res.type('txt').send('Not found');
});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Running on port ' + app.get('port'));
});