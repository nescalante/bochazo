angular.module('bchz.service').factory(
    'Sport', 
    ['$resource', '$rootScope', '$cacheFactory', 
    function($resource, $rootScope, $cacheFactory) {
        'use strict';

        var Sport = $resource('/api/sport', null, {
                list: { url: '/api/sport/list', method: 'GET', isArray: true }
            }),
            siteCache = $cacheFactory.get('site') || $cacheFactory('site');

        Sport.getByName = function getSport(sport, callback) {
            var sports = siteCache.get('sports'),
                result;

            if (!sports) {
                Sport.list(function (sports) {
                    siteCache.put('sports', sports);
                    getSport(sport, callback);
                });
            }
            else {
                result = va(sports)
                    .first(function (s) { return s.url == sport || s.name == sport; });

                callback(result);
            }
        };

        return Sport;
    }]);