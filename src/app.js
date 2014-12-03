'use strict';

var app = require('express')();
var taunus = require('taunus');
var express = require('taunus-express');
var jade = require('jade');
var path = require('path');

// initializate
//require('./server/config')(app);

console.log(path.normalize('.'))

express(taunus, app, {
  routes: require('./routes.js'),
  layout: jade.compileFile('./src/views/layout.jade'),
  getPartial: function (action, model, done) {
    var file = path.join('./src/views', action + '.jade');
    var html = jade.renderFile(file, model);

    done(null, html)
  }
});

app.set('port', 3000)

// start server
app.listen(app.get('port'), function() {
  console.log('Running ' + app.get('env') + ' environment on port ' + app.get('port'));
});
