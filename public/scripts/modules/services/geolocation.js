angular.module('bchz.service').factory(
    'Geolocation', 
    ['$rootScope', '$log', 
    function ($rootScope, $log) {
        'use strict';

        return { 
            get: function get(callback) {
                var geocoder;

                if ($rootScope.coords) {
                    callback(null, $rootScope.coords);
                }
                else if (navigator && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        $rootScope.coords = position.coords;

                        callback(null, { 
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                         });

                        if (typeof(google) === 'undefined') {
                            $log.warn('Google API failed to initialize.');

                            return;
                        }

                        geocoder = new google.maps.Geocoder();

                        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        geocoder.geocode({ latLng : latLng }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                var components = results[1] ? results[1].address_components : results[0].address_components;
                                    
                                $rootScope.userAddress = components[0].long_name + (components[1] ? ', ' + components[1].long_name : '');
                                $rootScope.$apply();
                            }
                        });
                    }, callback);
                } 
                else {
                    $log.warn('Geolocation is not supported.');

                    callback({ message: 'Geolocation is not supported.' });
                }
            },
            default: {
                latitude: -34.6037232,
                longitude: -58.38159310000003
            }
        }
    }]);
