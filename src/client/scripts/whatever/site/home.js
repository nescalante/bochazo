angular.module('bchz').controller(
    'HomeCtrl', 
    ['$scope', '$rootScope', '$location', '$window', 'appName', 'fullScreen', 'Geolocation', 'Place',
    function ($scope, $rootScope, $location, $window, appName, fullScreen, Geolocation, Place) {
        'use strict';

        var map = new google.maps.Map($window.document.getElementById('map-home')),
            query = {},
            places = [];

        $window.document.title = appName;

        $scope.focusSearch = function () {
            angular.element(".navbar input[type=search]")
                .focus();
        };

        $scope.reloadMap = function () {
            if ($scope.sport) {
                query.sport = $scope.sport.name;
            }
            else {
                query.sport = undefined;
            }

            angular.forEach(places, function (item) {
                if (item.deleteMarker) {
                    item.deleteMarker();
                }
            });

            $scope.count = null;

            Place.fillMap(map, query, function (result) {
                $scope.count = result.count;
                places = result.places;
            });
        };

        // set controller as map full screen mode
        fullScreen($scope, map);

        Geolocation.get(function (err, coords) {
            query.latitude = (coords && coords.latitude) || Geolocation.default.latitude;
            query.longitude = (coords && coords.longitude) || Geolocation.default.longitude;

            map.setCenter({ lat: query.latitude, lng: query.longitude });
            map.setZoom(coords ? 13 : 6);
            google.maps.event.trigger(map, 'resize');

            $scope.reloadMap();
        });
    }]);