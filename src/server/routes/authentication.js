var passport = require('passport'),
    service = require('../controllers');

module.exports = {
    loggedIn: function (req, res) {
        res.render('layout', { status: 'loggedIn' });
    },
    logout: function (req, res) {
        req.logout();
        res.redirect('/');
    },
    login: function(identifier, profile, done) {
        profile.identifier = identifier;

        service.user.login(profile, done);
    },
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) { 
            return next(); 
        }

        res.redirect('/login');
    },
    googleAuthenticate: passport.authenticate('google', { failureRedirect: '/' })
};