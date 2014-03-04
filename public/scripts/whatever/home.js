angular.module("bchz").controller(
	'HomeCtrl', 
	['$scope', '$rootScope', '$location', '$window', 'appName', 'Geolocation', 'Place',
	function ($scope, $rootScope, $location, $window, appName, Geolocation, Place) {
		var map = new google.maps.Map($window.document.getElementById('map-home'));

		$window.document.title = appName;
		$rootScope.fullScreen = true;
		$scope.$on('$destroy', function () { 
			$rootScope.fullScreen = false;
		});

		$scope.focusSearch = function () {
			angular.element(".navbar input[type=search]")
				.focus();
		};

		Geolocation.get(function (err, coords) {
			var query = {
					latitude: (coords && coords.latitude) || Geolocation.default.latitude,
					longitude: (coords && coords.longitude) || Geolocation.default.longitude
				};

			map.setCenter({ lat: query.latitude, lng: query.longitude });
			map.setZoom(coords ? 13 : 6);
			google.maps.event.trigger(map, 'resize');

			Place.fillMap(map, query, function (result) {
				$scope.count = result.count;
			});
		});
	}]);