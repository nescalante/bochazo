bchz.controller('PlaceDetailCtrl', ['$http', '$scope', '$location', '$routeParams', '$window', 'Place', function ($http, $scope, $location, $routeParams, $window, Place) {
	var map = new google.maps.Map($window.document.getElementById('map-detail'));

	var data = Place.get($routeParams, function () {
		$window.document.title = data.description;

		map.addMarker({
			latitude: data.latitude,
			longitude: data.longitude,
			zoom: 15
		});

		$scope.courts = data.courts
			.groupBy(function (c) { return {
				sport: c.sport,
				players: c.players,
				surface: c.surface,
				isIndoor: c.isIndoor
			}; })
			.groupBy(function (c) { return c.key.sport })
			.orderBy(function (c) { return c.key })
			.select(function (c) {
				c.count = c.sum(function (i) { return i.length });

				return c;
			});

		$scope.description = data.description;
		$scope.info = data.info;
		$scope.address = data.address;
		$scope.phones = data.phones;
		$scope.howToArrive = data.howToArrive;
		$scope.tags = data.tags;
	});
}]);