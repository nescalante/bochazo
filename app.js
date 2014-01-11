'use strict';

var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

var passport = require('passport'),
	GoogleStrategy = require('passport-google').Strategy;

passport.use(new GoogleStrategy({
	returnURL: 'http://localhost:3000/auth/google/return',
	realm: 'http://localhost:3000/'
}, function(identifier, profile, done) {
	profile.identifier = identifier;
	console.log(profile);

	return done(null, profile);
	//User.findOrCreate({ openId: identifier }, function(err, user) {
	//  done(err, user);
	//});
}));

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

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
app.use(express.session({ secret: 'palometa mutante' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

var path = { 
	public: path.join(__dirname, 'public'),
	components: path.join(__dirname, 'bower_components')
};

app.use(require('less-middleware')({ src: path.public }));
app.use('/', express.static(path.public));
app.use('/components', express.static(path.components));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

var routes = require('./routes');

app.get('/', routes.index);
app.get('/:partial/:name.html', routes.partial.get);

app.get('/api/place/get', routes.place.get);
app.get('/api/place/list', routes.place.list);
app.post('/api/place/insert', routes.place.insert);

app.get('/logout', routes.logout);
app.get('/auth/google', passport.authenticate('google', { failureRedirect: '/' }));
app.get('/auth/google/return', passport.authenticate('google', { failureRedirect: '/' }), routes.loggedIn);

http.createServer(app).listen(app.get('port'), function(){
	console.log('express server listening on port ' + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}