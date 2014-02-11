bchz.controller('PlaceSearchCtrl', ['$http', '$scope', '$rootScope', '$location', '$routeParams', '$window', function ($http, $scope, $rootScope, $location, $routeParams, $window) {
	$window.document.title = 'Búsqueda de canchas';
	var params = {};

	['surfaces', 'players', 'locations', 'tags'].forEach(function (item) {
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

	if ($routeParams.sport && $rootScope.sports) {
		$scope.sport = getSport($rootScope.sports);
	}
	else if ($rootScope.sport) {
		$rootScope.sportsPromise.then(function(sports) {
			$scope.sport = getSport(sports);
		});
	}

	params.surfaces.forEach(function (item) { $scope.surfaces[item] = true; });
	params.players.forEach(function (item) { $scope.players[item] = true; });

	$scope.submit = function () {
		var surfaces = [],
			players = [];

		if ($scope.currentLocation) {
			$rootScope.addTag($scope.currentLocation, $scope.locations);

			$scope.currentLocation = '';
		}

		if ($scope.currentTag) {
			$rootScope.addTag($scope.currentTag, $scope.tags);

			$scope.currentTag = '';
		}

		if ($scope.sport && $scope.sport.allowPlayers) {
			for (var p in $scope.players) {
				if ($scope.players.hasOwnProperty(p)) {
					$scope.players[p] && players.push(p);
				}
			}
		}

		for (var s in $scope.surfaces) {
			if ($scope.surfaces.hasOwnProperty(s)) {
				$scope.surfaces[s] && surfaces.push(s);
			}
		}

		var query = {
			locations: $scope.locations,
			tags: $scope.tags,
			sport: ($scope.sport && $scope.sport.url) || '',
			surfaces: surfaces,
			players: players
		};

		$location.path('/canchas/listado').search(query);
	};

	function getSport(source) {
		return source.first(function (s) { return s.url == $routeParams.sport || s.name == $routeParams.sport });
	}
}]);