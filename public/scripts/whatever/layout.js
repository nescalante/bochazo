function LayoutCtrl($scope, $location) {
	$scope.search = function () {
		$location.path('/canchas/listado').search({ 'query': $scope.query || '' });
	};
}