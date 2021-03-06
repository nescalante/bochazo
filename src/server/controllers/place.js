'use strict';

var async = require('async'),
    Place = require('../models/place'),
    Sport = require('../models/sport'),
    arrayAssert = require('array-assert');

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
    if (params.query) {
        var term = arrayAssert(params.query)[0];

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

    query = filter(query)
        .on('courts.sport').with(params.sport)
        .on('courts.surface').with(params.surfaces)
        .on('addressComponents.longName').with(params.locations)
        .on('tags').with(params.tags)
        .on('courts.players').withArray(params.players)
        .apply();

    if (!isCount && params.latitude && params.longitude) {
        query = query
            .where('location')
            .near({
                center: [params.latitude, params.longitude]
            });
    }

    return query;
}

function filter(query) {
    return {
        on: function (field) {
            return {
                with: function (param) {
                    if (param) {
                        return filter(query.in(field, arrayAssert(param)));
                    }
                    else {
                        return defaultResult();
                    }                    
                },
                withArray: function (param) {
                    var arrayParam;

                    if (param) {
                        if (!(param instanceof Array)) {
                            arrayParam = [param];
                        }
                        else {
                            arrayParam = param;
                        }

                        return filter(query.in(field, arrayParam));
                    }
                    else {
                        return defaultResult();
                    }                    
                }
            };
        },
        apply: function () {
            return query;
        }
    };

    function defaultResult() {
        return filter(query);
    }
}