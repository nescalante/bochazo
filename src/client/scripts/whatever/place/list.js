angular.module('bchz').controller(
    'PlaceListCtrl', 
    ['$http', '$scope', '$rootScope', '$location', '$routeParams', '$log', '$window', 'Geolocation', 'Place', 'Sport',
    function ($http, $scope, $rootScope, $location, $routeParams, $log, $window, Geolocation, Place, Sport) {
        'use strict';

        $window.document.title = 'Búsqueda de canchas';

        $scope.params = $routeParams;
        $scope.hasParams = !!($routeParams.query || 
            ($routeParams.surfaces && $routeParams.surfaces.length) || 
            ($routeParams.players && $routeParams.players.length) || 
            ($routeParams.locations && $routeParams.locations.length) || 
            ($routeParams.tags && $routeParams.tags.length));
        $scope.places = [];

        angular.forEach(['surfaces', 'players', 'locations', 'tags'], function (item) {
            if (typeof($scope.params[item]) == 'string') {
                $scope.params[item] = [$scope.params[item]];
            }
        });

        if ($scope.params.sport) {
            Sport.getByName($scope.params.sport, function (result) {
                $window.document.title = 'Canchas de ' + result.name;
                $scope.params.sport = result.name;
            });
        }

        $scope.redirectTo = function (path) {
            angular.forEach(['skip', 'latitude', 'longitude'], function (item) {
                delete $routeParams[item];
            });

            $location.path(path).search($routeParams);
        };

        $scope.showMore = (function showMore() {
            if ($scope.count != $scope.places.length) {
                $scope.loading = true;

                $scope.params.skip = $scope.params.skip || $scope.places.length;
                
                Geolocation.get(function (err, coords) {
                    if (coords) {
                        $scope.params.latitude = coords.latitude;
                        $scope.params.longitude = coords.longitude;
                    }

                    Place.list($scope.params, function (data) {
                        $scope.count = data.count;
                        $scope.loading = false;

                        angular.forEach(data.list, function (item) {
                            $scope.places.push(item);
                        });

                        $scope.params.skip = $scope.places.length;
                    }, function (err) { 
                        $log.error('Could not get data from server', err);
                    });
                });
            }

            return showMore;
        })();
    }]);