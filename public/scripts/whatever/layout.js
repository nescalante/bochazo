angular.module("bchz").controller(
	'LayoutCtrl', 
	['$scope', '$location', 
	function ($scope, $location) {
		$scope.search = function () {
			if ($scope.query) {
				$location.path('/listado').search({ 'query': $scope.query });
			}
		};
	}]);
