'use strict';

var taunus = require('taunus');
var main = document.getElementsByTagName('main')[0];

taunus.mount(main, {
  controllers: require('./controllers/client'),
  templates: require('./views'),
  routes: require('./routes.js')
});
