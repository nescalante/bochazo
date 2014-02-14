angular.module("bchz").controller(
	'PlaceListCtrl', 
	['$http', '$scope', '$rootScope', '$location', '$routeParams', '$window', 'Geolocation', 'Place', 
	function ($http, $scope, $rootScope, $location, $routeParams, $window, Geolocation, Place) {
		$window.document.title = 'Búsqueda de canchas';

		$scope.params = $routeParams;
		$scope.hasParams = !!($routeParams.query || $routeParams.surfaces || $routeParams.players || $routeParams.locations || $routeParams.tags);
		$scope.places = [];

		['surfaces', 'players', 'locations', 'tags'].forEach(function (item) {
			if (typeof($scope.params[item]) == 'string') {
				$scope.params[item] = [$scope.params[item]];
			}
		});

		if ($scope.params.sport && $rootScope.sports) {
			$scope.params.sport = getSport($rootScope.sports);

			$window.document.title = 'Canchas de ' + $scope.params.sport;
		}
		else if ($scope.params.sport) {
			$rootScope.sportsPromise.then(function(sports) {
				$scope.params.sport = getSport(sports);

				$window.document.title = 'Canchas de ' + $scope.params.sport;
			});
		}

		$scope.newSearch = function () {
			['skip', 'latitude', 'longitude'].forEach(function (item) {
				delete $routeParams[item];
			});

			$location.path('/busqueda').search($routeParams);
		};

		$scope.showMore = function showMore() {
			if ($scope.count != $scope.places.length) {
				$scope.loading = true;

				$scope.params.skip = $scope.params.skip || $scope.places.length;
				
				Geolocation.get(function (err, coords) {
					if (coords) {
						$scope.params.latitude = coords.latitude;
						$scope.params.longitude = coords.longitude;
					}

					var data = Place.list($scope.params, function () {
						$scope.count = data.count;
						$scope.loading = false;

						data.list.forEach(function (item) {
							item.summary = va(item.courts)
								.groupBy(function (c) { return c.sport })
								.orderBy(function (c) { return c.key });

							$scope.places.push(item);
						});

						$scope.params.skip = $scope.places.length;
					}, function (err) { console.log(err) ;});
				});
			}

			return showMore;
		}();

		function getSport(source) {
			return va(source)
				.any(function (s) { return s.url == $scope.params.sport }) ?
					va(source).first(function (s) { return s.url == $scope.params.sport }).name :
			 		$scope.params.sport;
		}
	}]);