angular.module("bchz").controller(
	'PlaceDetailCtrl', 
	['$http', '$scope', '$location', '$routeParams', '$window', 'Place', 
	function ($http, $scope, $location, $routeParams, $window, Place) {
		var map;

		if (typeof(google) !== 'undefined') {
			map = new google.maps.Map($window.document.getElementById('map-detail'));
		}
		else {
			console.log('Oops! Google Maps could not be initialized.')
		}

		Place.get($routeParams, function (resource) {
			$window.document.title = resource.description;

			map && map.addMarker({
				latitude: resource.latitude,
				longitude: resource.longitude,
				zoom: 15
			});

			$scope.courts = va(resource.courts)
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

			$scope.description = resource.description;
			$scope.info = resource.info;
			$scope.address = resource.address;
			$scope.phones = resource.phones;
			$scope.howToArrive = resource.howToArrive;
			$scope.tags = resource.tags;
		}, function (err) {
			console.log('Cannot get resource!', err);
		});
	}]);