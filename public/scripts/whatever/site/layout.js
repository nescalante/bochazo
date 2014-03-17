angular.module("bchz").controller(
	'LayoutCtrl', 
	['$rootScope', '$scope', '$location', '$route', '$log',
	function ($rootScope, $scope, $location, $route, $log) {
		'use strict';

		$scope.$on('$routeChangeSuccess', function(event, current) {
			$rootScope.templateUrl = null;

			// assign term on navbar query box
			if ($location.path() === '/listado') {
				$scope.query = current.params.query;
			}
			else {
				$scope.query = '';
			}
		});

		$scope.$on('$routeChangeError', function(event, current, previous, err) {
			$log.error('Resource failed to load', err);

			$rootScope.templateUrl = '/site/' + err.status + '.html';
		});

		$scope.search = function () {
			if ($scope.query) {
				$location.path('/listado').search({ 'query': $scope.query });
			}
		};
	}]);