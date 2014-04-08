'use strict';

var url = require('url'),
    service = require('../controllers');

exports.get = function(req, res) {
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
};

exports.list = function(req, res) {
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

exports.save = function(req, res) {
    service.place.insert(req.body, function (err, result) {
        if (err) {
            res.json(500, err);
        }
        else {
            res.json(result);
        }
    });
};