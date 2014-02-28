angular.module("bchz").controller(
	'MapCtrl', 
	['$scope', '$rootScope', '$location', '$window', '$compile', 'Geolocation', 'Place', 'InfoWindow',
	function ($scope, $rootScope, $location, $window, $compile, Geolocation, Place, InfoWindow) {
		var map = new google.maps.Map($window.document.getElementById('map-general')),
			iwOpened;

		$window.document.title = 'Mapa de canchas';
		$rootScope.fullScreen = true;
		$scope.$on('$destroy', function () { 
			$rootScope.fullScreen = false;
		});

		$scope.places = [];

		Geolocation.get(function (err, coords) {
			var query = {
					latitude: (coords && coords.latitude) || Geolocation.default.latitude,
					longitude: (coords && coords.longitude) || Geolocation.default.longitude
				},
				count;

			if (coords) {
				map.addMarker({
					latitude: coords.latitude,
					longitude: coords.longitude,
					zoom: 6
				});
			}
			else {
				map.setCenter({ lat: query.latitude, lng: query.longitude });
				google.maps.event.trigger(map, 'resize');
			}

			Place.fillMap(map, query);
		});
	}]);