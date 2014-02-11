var bchz = angular.module('bchz', ['ngRoute', 'ngAnimate', 'ngResource'])
	.run(function ($rootScope, $http, $window, $q) {
        $rootScope.sports = [];
        var deferredSports = $q.defer();

        $http({ method: 'GET', url: 'api/sport/list' }).success(function (data, status, xhr) {
            $rootScope.sports = data;

            deferredSports.notify(data);
        });

        $rootScope.sportsPromise = deferredSports.promise;

		$rootScope.back = function () {
			$window.history.back();
		};

        $rootScope.addTag = function (tag, target) {
			var tags,
				invalidTags = [];

			if (tag && target) {
				tags = tag.split(',');

				for (var i = 0; i < tags.length; i++) {
					var currentTag = tags[i].trim().toLowerCase();

					if (!target.contains(currentTag)) {
						if (currentTag != '') {
							target.push(currentTag);
						}
					}
					else {
						invalidTags.push(currentTag);
					}
				}

				tag = invalidTags.join(', ');
			}

			return tag;
		};

		$rootScope.removeTag = function (tag, target) {
 			target = target.where(function (t) { return t != tag });

			return target;
		};

		$rootScope.validateTag = function (tag, target) {
			if (target) {
				return target
					.select(function (t) { return t.toLowerCase(); })
					.contains(tag && tag.toLowerCase());
			}
			else {
				return false;
			}
		};
	})
	.factory('Geolocation', function ($rootScope) {
		return { 
			get: function get(callback) {
				var geocoder = new google.maps.Geocoder();

				if ($rootScope.coords) {
					callback(null, $rootScope.coords);
				}
				else if (navigator && navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function (position) {
						$rootScope.coords = position.coords;

						callback(null, { 
							latitude: position.coords.latitude,
							longitude: position.coords.longitude,
							accuracy: position.coords.accuracy
						 });

						var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
						geocoder.geocode({ latLng : latLng }, function (results, status) {
							if (status == google.maps.GeocoderStatus.OK) {
								var components = results[1] ? results[1].address_components : results[0].address_components;
									
								$rootScope.userAddress = components[0].long_name + (components[1] ? ', ' + components[1].long_name : '');
								$rootScope.$apply();
							}
						});
					}, callback);
				} 
				else {
					callback({ message: 'Geolocation is not supported' });
				}
			},
			default: {
				latitude: -34.6037232,
				longitude: -58.38159310000003
			}
		}
	})
	.factory('Place', ['$resource', function($resource) {
		return $resource('/api/place', null, {
			get: { url: '/api/place/get/:name', method: 'GET' },
			list: { url: '/api/place/list', method: 'GET' }
		});
	}])
	.config(function ($routeProvider) {
		$routeProvider
			.when('/', { controller: 'HomeCtrl', templateUrl: 'place/search.html' })
			.when('/busqueda', { controller: 'PlaceSearchCtrl', templateUrl: 'place/search.html' })
			.when('/listado', { controller: 'PlaceListCtrl', templateUrl: 'place/list.html' })
			.when('/mapa', { controller: 'MapCtrl', templateUrl: 'site/map.html' })
			.when('/canchas/agregar', { controller: 'PlaceAddCtrl', templateUrl: 'place/add.html' })
			.when('/canchas/listado/:sport', { controller: 'PlaceListCtrl', templateUrl: 'place/list.html' })
			.when('/canchas/listado', { controller: 'PlaceListCtrl', templateUrl: 'place/list.html' })
			.when('/canchas/:name', { controller: 'PlaceDetailCtrl', templateUrl: 'place/detail.html' })
			.otherwise({ redirectTo: '/' });
	});