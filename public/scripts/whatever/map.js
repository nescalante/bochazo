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

			(function callList() {
				if (!count || count > $scope.places.length) {
					Place.listShortened(query, function (data) {
						angular.forEach(data.list, function (item) {
							var marker = map.addMarker({
									latitude: item.latitude,
									longitude: item.longitude,
									description: item.description,
									clearLast: false,
									setCenter: false,
									zoom: 6
								});

							item.open = function () {
								if (item.iw) {
									item.iw.open(map, marker);

									iwOpened && iwOpened != item.iw && iwOpened.close();
									iwOpened = item.iw;
								}
							}

							google.maps.event.addListener(marker, 'click', function() {
								if (item.iw) {
									item.open();
								}
								else {
									InfoWindow.get(item._id, function (iw) {
										item.iw = iw;
										item.open();
									});
								}
							});

							$scope.places.push(item);
						});

						query.skip = $scope.places.length;
						count = data.count;

						if (data.list.length > 0) {
							callList();
						}
					}, function (err) { 
						$log.error('Could not get data from server', err);
					});
				}
			})();
		});
	}]);