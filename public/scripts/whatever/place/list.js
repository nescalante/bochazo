function PlaceListCtrl($http, $scope, $location, $routeParams) {
	$scope.places = [];

	$scope.showMore = function () {
		if ($scope.count != $scope.places.length) {
			$scope.loading = true;
			$http({ method: 'GET', url: '/api/place/list', params: { init: $scope.places.length, query: $routeParams.query, sport: $routeParams.sport } }).success(function (data, status, xhr) {
				$scope.count = data.count;
				$scope.loading = false;

				data.list.each(function (ix, item) {
					item.summary = item.courts
						.groupBy(function (c) { return c.sport })
						.orderBy(function (c) { return c.key });
					$scope.places.push(item);
				});
			});
		}
	};

	$scope.showMore();
}