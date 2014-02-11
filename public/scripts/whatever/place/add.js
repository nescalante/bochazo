bchz.controller('PlaceAddCtrl', ['$http', '$scope', '$rootScope', '$location', '$window', 'Geolocation', 'Place', function ($http, $scope, $rootScope, $location, $window, Geolocation, Place) {
	var map = new google.maps.Map($window.document.getElementById('map-add'));

	$window.document.title = 'Agregá tu cancha';
	$scope.tags = [];
	$scope.courts = [];

	Geolocation.get(function (err, coords) {
		var latitude = (coords && coords.latitude) || Geolocation.default.latitude,
			longitude = (coords && coords.longitude) || Geolocation.default.longitude;

		map.addMarker({
			latitude: latitude,
			longitude: longitude,
			zoom: 5,
			drag: function (results) {
				assignResult(results[0]);
				
				$scope.$apply();
			}
		});
	});

	$scope.save = function () {
		if ($scope.currentTag) {
			$rootScope.addTag($scope.currentTag, $scope.tags);

			$scope.currentTag = '';
		}

		var phones = $scope.phone ? $scope.phone
			.split(',')
			.select(function (p) { return p.trim() })
			.where(function (p) { return p != '' })
			.distinct() : [];

		var place = new Place({
			description: $scope.description,
			info: $scope.info,
			phones: phones,
			address: $scope.address,
			latitude: $scope.latitude,
			longitude: $scope.longitude,
			addressComponents: $scope.addressComponents,
			tags: $scope.tags,
			courts: $scope.courts
		});

		place.$save(function (result) {
			$location.path('/canchas/' + result.name);
		}, function (response) {
			console.log(response);
		});
	};

	$scope.setAddress = function (address) {
		map.addMarker({
			latitude: address.latitude,
			longitude: address.longitude,
			description: $scope.description,
			zoom: 15,
			drag: function (results) {
				assignResult(results[0]);

				$scope.$apply();
			}
		});

		assignResult(address);
	};

	$scope.addressSearch = function () {
		if ($scope.address) {
			$scope.addressResults = [];
			$scope.loadingAddress = true;

			map.addMarker({
				address: $scope.address,
				description: $scope.description,
				zoom: 15,
				drag: function (results) {
					assignResult(results[0]);

					$scope.$apply();
				},
				success: function (results) {
					assignResult(results[0], false);

					$scope.addressResults = results;
				},
				complete: function () {
					$scope.loadingAddress = false;
					$scope.$apply();
				}
			});
		}
	};

	$scope.$watchCollection('courts', function() {
		$scope.groupedCourts = $scope.courts
			.groupBy(function (c) { return {
				sport: c.sport,
				players: c.players,
				surface: c.surface,
				isIndoor: c.isIndoor
			}; })
			.groupBy(function (c) { return c.key.sport })
			.orderBy(function (c) { return c.key });
	});

	$scope.addCourt = function(court) {
		if (court && court.sport) {
			$scope.courts.push({
				sport: court.sport.name || court.sport,
				players: court.players,
				surface: court.surface,
				isIndoor: court.isIndoor,
			});
		}
	}

	$scope.removeCourt = function(court) {
		$scope.courts = $scope.courts.where(function (c) { return c != court });
	}

	function assignResult(result, assignAddress) {
		if (assignAddress !== false) {
			$scope.address = result.address;    
			$scope.addressResults = [];
		}
		
		$scope.addressComponents = result.addressComponents;
		$scope.latitude = result.latitude;
		$scope.longitude = result.longitude;
	}
}]);