angular.module("bchz").controller(
	'MapCtrl', 
	['$scope', '$rootScope', '$location', '$window', '$compile', 'Geolocation', 'Place', 'InfoWindow',
	function ($scope, $rootScope, $location, $window, $compile, Geolocation, Place, InfoWindow) {
		var map = new google.maps.Map($window.document.getElementById('map-general'));

		$window.document.title = 'Mapa de canchas';
		$rootScope.fullScreen = true;
		$scope.$on('$destroy', function () { 
			$rootScope.fullScreen = false;
		});

		Geolocation.get(function (err, coords) {
			var query = {
					latitude: (coords && coords.latitude) || Geolocation.default.latitude,
					longitude: (coords && coords.longitude) || Geolocation.default.longitude
				};

			map.setCenter({ lat: query.latitude, lng: query.longitude });
			map.setZoom(coords ? 13: 6);
			google.maps.event.trigger(map, 'resize');

			Place.fillMap(map, query);
		});
	}]);