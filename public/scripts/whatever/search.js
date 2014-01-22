function PlaceSearchCtrl($http, $scope, $location, $routeParams) {
	$scope.locations = [];
	$scope.tags = [];
	$scope.players = [];
	$scope.surfaces = [];

	$scope.submit = function () {
		var surfaces = [],
			players = [];

		if ($scope.currentLocation) {
			$rootScope.addTag($scope.currentLocation, $scope.locations);

			$scope.currentLocation = "";
		}

		if ($scope.currentTag) {
			$rootScope.addTag($scope.currentTag, $scope.tags);

			$scope.currentTag = "";
		}

		if ($scope.sport.allowPlayers) {
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

		var search = {
			locations: $scope.locations,
			tags: $scope.tags,
			sport: $scope.sport.name,
			surfaces: surfaces,
			players: players
		};

		console.log(search);
	};
}