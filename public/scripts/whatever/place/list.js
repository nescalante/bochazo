function PlaceListCtrl($http, $scope, $location, $routeParams, geolocation, Place) {
	$scope.places = [];

	$scope.showMore = function () {
		if ($scope.count != $scope.places.length) {
			$scope.loading = true;

			var params = $routeParams;
				params.skip = params.skip || $scope.places.length;

			geolocation.get(function (coords) {
				if (coords) {
					params.latitude = coords.latitude;
					params.longitude = coords.longitude;
				}

				var data = Place.list(params, function () {
					$scope.count = data.count;
					$scope.loading = false;

					data.list.each(function (ix, item) {
						item.summary = item.courts
							.groupBy(function (c) { return c.sport })
							.orderBy(function (c) { return c.key });
						$scope.places.push(item);
					});

					console.log($scope.places)
				}, function (err) { console.log(err) ;});
			});
		}
	};

	$scope.showMore();
}