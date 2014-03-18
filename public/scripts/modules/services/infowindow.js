angular.module('bchz.service').factory(
    'InfoWindow', 
    ['$http', '$compile', '$rootScope', '$cacheFactory', '$timeout', 
    function ($http, $compile, $rootScope, $cacheFactory, $timeout) {
        'use strict';

        return {
            get: function get (place, callback) {
                var cache = $cacheFactory.get('iw') || $cacheFactory('iw'),
                    template = cache.get('template');

                if (template) {
                    initialize();
                }
                else {
                    $http.get('/place/info.html').success(function (html) {
                        cache.put('template', html);
                        get(place, callback);
                    });
                }

                function initialize() {
                    var iwScope,
                        element;

                    iwScope = $rootScope.$new(true);
                    iwScope.place = place;
                    element = $compile(template)(iwScope);

                    // wait for digest
                    $timeout(function () {
                        var iw = new google.maps.InfoWindow({
                            content: element.html()
                        });

                        iwScope.$destroy();
                        callback(iw);
                    }, 1);
                }
            }
        }
    }]);