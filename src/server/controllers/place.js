'use strict';

var async = require('async'),
    Place = require('../models/place'),
    Sport = require('../models/sport');

exports.get = function (id, callback) {
    return Place.findOne({ _id: id }, callback);
};

exports.list = function (params, callback) {
    params = params || {};

    var skip = params.skip || 0,
        limit = params.limit || (params.shortened ? 200 : 20),
        fields = params.shortened ? 
            { 'location': 1, 'description': 1 } :
            { 'addressComponents': 0, 'id': 0, 'courts.isActive': 0 };

    async.parallel([
        function (task) {
            var query = Place.find({}, fields);

            applyFilters(query, params)
                .skip(skip)
                .limit(limit)
                .exec(function (err, data) {
                    task(null, { 
                        err: err, 
                        data: data
                    });
                });
        }, 
        function (task) {
            var query = Place.find({});
            
            applyFilters(query, params, true)
                .count(function (err, data) {
                    task(null, {
                        err: err, 
                        data: data 
                    });
                });
        }
    ], function (err, results) {
        var list, count;

        err = err || results[0].err || results[1].err;

        if (err) {
            callback(err, {
                err: err
            });
        }
        else {
            list = params.shortened ? results[0].data.map(function (i) { return { 
                _id: i._id,
                description: i.description,
                latitude: i.latitude,
                longitude: i.longitude
            }; }) : results[0].data;
            count = results[1].data;

            callback(null, {
                list: list,
                count: count
            });
        }
    });
};

exports.insert = function (model, callback) {
    var permalink = model.description
        .replace(/\s/g, '')
        .replace(/\W/g, '');

    model._id = permalink;

    new Place(model).save(callback);
};

exports.count = function (model, callback) {
    new Place.count(callback);
};

function applyFilters(query, params, isCount) {
    if (params.sport) {
        query = query.where('courts.sport', regex.getAI(params.sport));
    }
    
    if (params.query) {
        var term = regex.getAI(params.query);

        query = query
            .or([
                { 'description': { $regex: term } },
                { 'phones': { $regex: term } },
                { 'address': { $regex: term } },
                { 'addressComponents.longName': { $regex: term } },
                { 'tags': { $regex: term } },
                { 'courts.sport': { $regex: term } },
                { 'courts.surface': { $regex: term } }
            ]);
    }

    if (params.locations) {
        query = query.in('addressComponents.longName', createRegexArray(params.locations));
    }

    if (params.tags) {
        query = query.in('tags', createRegexArray(params.tags));
    }

    if (params.players) {
        query = query.in('courts.players', createArray(params.players));
    }

    if (params.surfaces) {
        query = query.in('courts.surface', createRegexArray(params.surfaces));
    }

    if (!isCount && params.latitude && params.longitude) {
        query = query
            .where('location')
            .near({
                center: [params.latitude, params.longitude]
            });
    }

    return query;
}

function createRegexArray(param) {
    if (!(param instanceof Array))
    {
        param = [param];
    }

    return param.map(function (l) { 
        return regex.getAI(l);
    });
}

function createArray(param) {
    if (!(param instanceof Array))
    {
        param = [param];
    }

    return param;
}