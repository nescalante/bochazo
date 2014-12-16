'use strict';

var url = require('url');
var service = require('../services');

module.exports = {
  get: get,
  list: list,
  save: save
};

function get(req, res) {
  if (req.params.id) {
    service.place.get(req.params.id, function (err, result) {
      if (err) {
        res.json(500, err);
      }
      else {
        if (result) {
          res.json(result);
        }
        else {
          res.json(404, { message: 'Place not found for that id.'});
        }
      }
    });
  }
  else {
    res.json(400, { message: '"id" field is required.' });
  }
}

function list(req, res) {
  var qs = url.parse(req.url, true).query;

  service.place.list(qs, function (err, result) {
    if (err) {
      res.json(500, err);
    }
    else {
      res.json(result);
    }
  });
};

function save(req, res) {
  service.place.insert(req.body, function (err, result) {
    if (err) {
      res.json(500, err);
    }
    else {
      res.json(result);
    }
  });
};
