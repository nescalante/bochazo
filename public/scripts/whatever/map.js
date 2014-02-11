function MapCtrl($scope, $rootScope, $location, $window, Geolocation, Place) {
	var map = new google.maps.Map($window.document.getElementById('map-general'));

	$window.document.title = 'Mapa de canchas';
	$rootScope.fullScreen = true;
	$scope.$on('$destroy', function (a) { 
		$rootScope.fullScreen = false;
	});

	Geolocation.get(function (err, coords) {
		var latitude = (coords && coords.latitude) || Geolocation.default.latitude,
			longitude = (coords && coords.longitude) || Geolocation.default.longitude;

		map.addMarker({
			latitude: latitude,
			longitude: longitude,
			zoom: 6
		});
	});
}