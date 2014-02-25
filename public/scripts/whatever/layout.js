var g;

angular.module("bchz").controller(
	'LayoutCtrl', 
	['$scope', '$location', '$route',
	function ($scope, $location, $route) {
		$scope.$on('$routeChangeSuccess', function(event, route) { 
			$scope.query = route.params.query;
		})

		$scope.search = function () {
			if ($scope.query) {
				$location.path('/listado').search({ 'query': $scope.query });
			}
		};
	}]);
