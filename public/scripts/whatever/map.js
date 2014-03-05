angular.module("bchz").controller(
	'MapCtrl', 
	['$scope', '$rootScope', '$location', '$routeParams', '$window', '$compile', 'Geolocation', 'Place', 'InfoWindow',
	function ($scope, $rootScope, $location, $routeParams, $window, $compile, Geolocation, Place, InfoWindow) {
		var map = new google.maps.Map($window.document.getElementById('map-general')),
			query = $routeParams;

		$window.document.title = 'Mapa de canchas';
		$rootScope.fullScreen = $rootScope.hideFooter = true;
		$scope.$on('$destroy', function () { 
			$rootScope.fullScreen = $rootScope.hideFooter = false;
		});

		Geolocation.get(function (err, coords) {
			query.latitude = $routeParams.latitude || (coords && coords.latitude) || Geolocation.default.latitude;
			query.longitude = $routeParams.longitude || (coords && coords.longitude) || Geolocation.default.longitude;

			map.setCenter({ lat: query.latitude, lng: query.longitude });
			map.setZoom(coords ? 13: 6);
			google.maps.event.trigger(map, 'resize');

			Place.fillMap(map, query);
		});
	}]);