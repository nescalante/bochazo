angular.module("bchz").controller(
	'PlaceDetailCtrl', 
	['$http', '$scope', '$location', '$window', '$log', 'place', 
	function ($http, $scope, $location, $window, $log, place) {
		'use strict';

		var map;

		if (typeof(google) !== 'undefined') {
			map = new google.maps.Map($window.document.getElementById('map-detail'));
		}
		else {
			$log.warn('Oops! Map could not be initialized.')
		}

		$window.document.title = place.description;

		map && map.addMarker({
			latitude: place.latitude,
			longitude: place.longitude,
			zoom: 15
		});

		$scope.showMap = !!map;
		$scope.courts = va(place.courts)
			.groupBy(function (c) { 
				return {
					sport: c.sport,
					players: c.players,
					surface: c.surface,
					isIndoor: c.isIndoor
				};
			})
			.groupBy(function (c) { return c.key.sport })
			.orderBy(function (c) { return c.key })
			.select(function (c) {
				c.count = c.sum(function (i) { return i.length });

				return c;
			});

		$scope.description = place.description;
		$scope.info = place.info;
		$scope.address = place.address;
		$scope.phones = place.phones;
		$scope.howToArrive = place.howToArrive;
		$scope.tags = place.tags;
	}]);