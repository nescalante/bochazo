function PlaceDetailCtrl($http, $scope, $location, $routeParams) {
	var map = new google.maps.Map(document.getElementById('map-detail'));

	if ($routeParams.name) {
		$http({ method: 'GET', url: '/api/place/get', params: { name: $routeParams.name } }).success(function (data, status, xhr) {
			map.addMarker({
				latitude: data.latitude,
				longitude: data.longitude,
				zoom: 15
			});

			$scope.description = data.description;
			$scope.info = data.info;
			$scope.address = data.address;
			$scope.phone = data.phone;
			$scope.howToArrive = data.howToArrive;
			$scope.tags = data.tags;

		}).error(function () {
			$location.path('/canchas/');
		});
	}
}