'use strict';

// create express app
var app = require('express')();

// initializate
require('./server/config')(app);

// start server
require('http')
    .createServer(app)
    .listen(app.get('port'), function() {
        console.log('Running ' + app.get('env') + ' environment on port ' + app.get('port'));
    });