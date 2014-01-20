function PlaceDetailCtrl($http, $scope, $location, $routeParams) {
	var map = new google.maps.Map(document.getElementById('map-detail'));

	if ($routeParams.name) {
		$http({ method: 'GET', url: '/api/place/get', params: { name: $routeParams.name } }).success(function (data, status, xhr) {
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

			console.log($scope.courts);

			$scope.description = data.description;
			$scope.info = data.info;
			$scope.address = data.address;
			$scope.phone = data.phone;
			$scope.howToArrive = data.howToArrive;
			$scope.tags = data.tags;
		}).error(function () {
			$location.path('/canchas/listado');
		});
	}
}