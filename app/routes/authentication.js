var passport = require('passport');

module.exports = exports = {
    loggedIn: function (req, res) {
        res.render('layout', { status: 'loggedIn' });
    },
    logout: function (req, res) {
        req.logout();
        res.redirect('/');
    },
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) { 
            return next(); 
        }

        res.redirect('/login');
    },
    googleAuthenticate: passport.authenticate('google', { failureRedirect: '/' })
};