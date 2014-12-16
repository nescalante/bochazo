'use strict';

var url = require('url');
var service = require('../services');

module.exports = {
  list: list
};

function list(req, res) {
  service.sport.list(function (err, result) {
    if (err) {
      res.json(500, err);
    }
    else {
      res.json(result);
    }
  });
}
