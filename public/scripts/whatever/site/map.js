angular.module('bchz').controller(
    'MapCtrl', 
    ['$scope', '$rootScope', '$location', '$routeParams', '$window', '$compile', 'Geolocation', 'Place', 'Sport', 'InfoWindow',
    function ($scope, $rootScope, $location, $routeParams, $window, $compile, Geolocation, Place, Sport, InfoWindow) {
        'use strict';

        var map = new google.maps.Map($window.document.getElementById('map-general')),
            query = $routeParams;

        $window.document.title = 'Mapa de canchas';
        $rootScope.fullScreen = $rootScope.hideFooter = true;
        $scope.$on('$destroy', function () { 
            $rootScope.fullScreen = $rootScope.hideFooter = false;
        });

        $scope.params = $routeParams;
        $scope.hasParams = !!($routeParams.query || 
            $routeParams.sport || 
            ($routeParams.surfaces && $routeParams.surfaces.length) || 
            ($routeParams.players && $routeParams.players.length) || 
            ($routeParams.locations && $routeParams.locations.length) || 
            ($routeParams.tags && $routeParams.tags.length));

        angular.forEach(['surfaces', 'players', 'locations', 'tags'], function (item) {
            if (typeof($scope.params[item]) == 'string') {
                $scope.params[item] = [$scope.params[item]];
            }
        });

        $scope.params.sport && Sport.getByName($scope.params.sport, function (result) {
            $window.document.title = 'Canchas de ' + result.name;
            $scope.params.sport = result.name;
        });

        $scope.redirectTo = function (path) {
            angular.forEach(['skip', 'latitude', 'longitude'], function (item) {
                delete $routeParams[item];
            });

            $routeParams.fromMap = 1;
            $location.path(path).search($routeParams);
        };

        Geolocation.get(function (err, coords) {
            query.latitude = $routeParams.latitude || (coords && coords.latitude) || Geolocation.default.latitude;
            query.longitude = $routeParams.longitude || (coords && coords.longitude) || Geolocation.default.longitude;

            map.setCenter({ lat: query.latitude, lng: query.longitude });
            map.setZoom(coords ? 13: 6);
            google.maps.event.trigger(map, 'resize');

            Place.fillMap(map, query, function (result) {
                $scope.count = result.count;
            });
        });
    }]);