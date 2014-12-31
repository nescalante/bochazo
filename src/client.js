'use strict';

var taunus = require('taunus');
var main = document.getElementsByTagName('main')[0];
var wiring = require('taunus-wiring')();

taunus.mount(main, wiring);
