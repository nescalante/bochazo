function LayoutCtrl($scope, $location) {
	$scope.search = function () {
		$location.path('/listado').search({ 'query': $scope.query || '' });
	};
}