var x;

function PlaceAddCtrl($http, $scope, $location) {
	var map = new google.maps.Map(document.getElementById('map-add')),
		indexedTypes = [];

	$scope.tags = [];
	$scope.courts = [];

	map.addMarker({
		latitude: -38,
		longitude: -63,
		zoom: 4,
		drag: function (results) {
			assignResult(results[0]);
			
			$scope.$apply();
		}
	});

	$http({ method: 'GET', url: '/api/sport/list' }).success(function (data, status, xhr) {
		$scope.sports = data;
	}).error(function () {
		$location.path('/canchas/');
	});

	$scope.save = function () {
		if ($scope.currentTag) {
			$scope.addTag($scope.currentTag);
		}

		$http({ method: 'POST', url: '/api/place/insert', data: {
			name: $scope.description,
			description: $scope.description,
			info: $scope.info,
			phone: $scope.phone,
			address: $scope.address,
			latitude: $scope.latitude,
			longitude: $scope.longitude,
			addressComponents: $scope.addressComponents,
			tags: $scope.tags,
			courts: $scope.courts
		} }).success(function (response) {
			$location.path('/canchas/' + $scope.description);
		}).error(function (response) {
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

	$scope.addTag = function (tag) {
		var tags,
			invalidTags = [];

		if (tag) {
			tags = tag.split(',');

			for (var i = 0; i < tags.length; i++) {
				var currentTag = tags[i].trim().toLowerCase();

				if (!$scope.tags.contains(currentTag)) {
					$scope.tags.push(currentTag);
				}
				else {
					invalidTags.push(currentTag);
				}
			}

			$scope.currentTag = invalidTags.join(', ');
		}
	};

	$scope.removeTag = function (tag) {
		$scope.tags = $scope.tags.where(function (t) { return t != tag });
	};

	$scope.validateTag = function (tag) {
		return $scope.tags
			.select(function (t) { return t.toLowerCase(); })
			.contains(tag && tag.toLowerCase());
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
				sport: court.sport.name,
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
}