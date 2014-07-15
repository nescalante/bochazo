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
    login: function (identifier, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { 
                return done(err); 
            }
            
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
                
            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, user);
        });
    },
    googleLogin: function(identifier, profile, done) {
        profile.identifier = identifier;
        profile.email = profile.emails[0].value;

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