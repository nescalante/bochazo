angular.module('bchz.service').factory(
    'Place', 
    ['$resource', '$cacheFactory', '$log', 'InfoWindow', 
    function($resource, $cacheFactory, $log, InfoWindow) {
        'use strict';

        var Place = $resource('/api/place', null, {
                get: { url: '/api/place/get/:id', method: 'GET', transformResponse: transformGet },
                list: { url: '/api/place/list', method: 'GET', transformResponse: transformList },
                listShortened: { url: '/api/place/list', method: 'GET', params: { shortened: 1 }, transformResponse: transformList },
            });

        Place.prototype.appendMarker = function (map) {
            var item = this,
                iw,
                marker = map.addMarker({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    description: item.description,
                    clearLast: false,
                    setCenter: false
                }),
                iwCache = $cacheFactory.get('iw') || $cacheFactory('iw');

            item.openInfo = function () {
                var last = iwCache.get('last');

                if (iw) {
                    iw.open(map, marker);

                    last && last != iw && last.close();
                    iwCache.put('last', iw);
                }
            }

            item.getMarker = function () {
                return marker;
            };

            item.deleteMarker = function () {
                marker.setMap(null);
            };

            item.showMarker = function () {
                marker.setMap(map);
            };

            google.maps.event.addListener(marker, 'click', function() {
                if (iw) {
                    item.openInfo();
                }
                else {
                    Place.get({ id: item._id }, function (place) {
                        InfoWindow.get(place, function (result) {
                            iw = result;
                            item.openInfo();
                        });
                    });
                }
            });
        };

        Place.fillMap = function fillMap(map, query, callback, limit, places) {
            if (!limit || limit > query.skip) {
                Place.listShortened(query, function (data) {
                    places = places || [];

                    angular.forEach(data.list, function (item) {
                        item.appendMarker(map);
                        places.push(item);
                    });

                    query.skip = (query.skip || 0) + data.list.length;

                    if (data.list.length > 0) {
                        fillMap(map, query, callback, data.count, places);
                    }
                    else {
                        callback(getResponse(data.count, places));
                    }
                }, function (err) { 
                    $log.error('Could not get data from server', err);
                });
            }
            else {
                if (callback) {
                    callback(getResponse(limit, places));
                }
            }

            function getResponse(count, places) {
                delete query.skip;

                return {
                    query: query,
                    map: map,
                    count: count,
                    places: places
                }
            }
        }

        return Place;

        function transformList(data, header) {
            var wrapped = angular.fromJson(data);

            angular.forEach(wrapped.list, function (value, index) {
                value.summary = value.courts && getSummary(value.courts);
                wrapped.list[index] = new Place(value);
            });

            return wrapped;
        }

        function transformGet(data, header) {
            var wrapped = angular.fromJson(data);

            wrapped.summary = wrapped.courts && getSummary(wrapped.courts);

            return wrapped;
        }

        function getSummary(courts) {
            return va(courts)
                .groupBy(function (c) { return c.sport })
                .orderBy(function (c) { return c.key });
        }
    }]);