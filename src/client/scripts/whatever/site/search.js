angular.module('bchz').controller(
    'PlaceSearchCtrl', 
    ['$http', '$scope', '$rootScope', '$location', '$routeParams', '$window', 'Sport',
    function ($http, $scope, $rootScope, $location, $routeParams, $window, Sport) {
        'use strict';

        $window.document.title = 'Búsqueda de canchas';
        var params = {};

        angular.forEach(['surfaces', 'players', 'locations', 'tags'], function (item) {
            if (typeof($routeParams[item]) == 'string') {
                params[item] = [$routeParams[item]];
            }
            else {
                params[item] = $routeParams[item] || [];
            }
        });

        $scope.locations = params.locations;
        $scope.tags = params.tags;
        $scope.surfaces = [];
        $scope.players = [];
        $scope.showMap = !!$routeParams.fromMap;

        Sport.getByName($routeParams.sport, function (result) {
            if (result) {
                $scope.sport = va($rootScope.sports).first(function (s) { return s.url == result.url; });
            }
        });

        angular.forEach(params.surfaces, function (item) { $scope.surfaces[item] = true; });
        angular.forEach(params.players, function (item) { $scope.players[item] = true; });

        $scope.submit = function () {
            var surfaces = [],
                players = [],
                query,
                path;

            if ($scope.sport && $scope.sport.allowPlayers) {
                for (var p in $scope.players) {
                    if ($scope.players.hasOwnProperty(p) && $scope.players[p]) {
                         players.push(p);
                    }
                }
            }

            for (var s in $scope.surfaces) {
                if ($scope.surfaces.hasOwnProperty(s) && $scope.surfaces[s]) {
                    surfaces.push(s);
                }
            }

            query = {
                locations: $scope.locations,
                tags: $scope.tags,
                sport: ($scope.sport && $scope.sport.url) || '',
                surfaces: surfaces,
                players: players
            };
            path = $scope.showMap ? '/mapa' : '/canchas/listado';

            $location.path(path).search(query);
        };
    }]);