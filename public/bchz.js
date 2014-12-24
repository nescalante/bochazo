(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

//var taunus = require('taunus');
var main = document.getElementsByTagName('main')[0];

var opts = console.log("testing");console.log({"views":"src/views","server_routes":"src/routes","server_controllers":"src/controllers/server","client_controllers":"src/controllers/client","client_wiring":".bin/wiring.js"});/*test*/;

//taunus.mount(main, opts);

//taunus.mount({
//  controllers: require('./controllers/client'),
//  templates: require('./views'),
//  routes: require('./routes.js')
//});

},{}]},{},[1]);
