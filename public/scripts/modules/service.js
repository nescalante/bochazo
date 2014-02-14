angular.module('bchz.service', ['ngResource'])
	.factory('Geolocation', function ($rootScope) {
		return { 
			get: function get(callback) {
				if (typeof(google) === 'undefined') {
					callback({ message: 'Google API failed to initialize.' });

					return;
				}

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
					callback({ message: 'Geolocation is not supported.' });
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
			get: { url: '/api/place/get/:id', method: 'GET' },
			list: { url: '/api/place/list', method: 'GET' }
		});
	}])
	.factory('Sport', ['$resource', function($resource) {
		return $resource('/api/sport', null, {
			list: { url: '/api/sport/list', method: 'GET', isArray: true }
		});
	}]);