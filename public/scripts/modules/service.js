angular.module('bchz.service', ['ngResource'])
	.factory('Geolocation', function ($rootScope, $log) {
		return { 
			get: function get(callback) {
				var geocoder;

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

						if (typeof(google) === 'undefined') {
							$log.warn('Google API failed to initialize.');

							return;
						}

						geocoder = new google.maps.Geocoder();

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
					$log.warn('Geolocation is not supported.');

					callback({ message: 'Geolocation is not supported.' });
				}
			},
			default: {
				latitude: -34.6037232,
				longitude: -58.38159310000003
			}
		}
	})
	.factory('InfoWindow', ['$http', '$compile', '$rootScope', '$cacheFactory', 'Place', function ($http, $compile, $rootScope, $cacheFactory, Place) {
		return {
			get: function get (id, callback) {
				var cache = $cacheFactory.get('iw') || $cacheFactory('iw'),
					template = cache.get('template');

				if (template) {
					initialize();
				}
				else {
					$http.get('/place/info.html').success(function (html) {
						cache.put('template', html);
						get(id, callback);
					});
				}

				function initialize() {
					var iwScope,
						element;

					iwScope = $rootScope.$new(true);

					Place.get({ id: id }, function (place) {
						iwScope.place = place;
						element = $compile(template)(iwScope);

						// wait for digest
						setTimeout(function () {
							var iw = new google.maps.InfoWindow({
								content: element.html()
							});

							iwScope.$destroy();
							callback(iw);
						}, 1);
					});
				}
			}
		}
	}])
	.factory('Place', ['$resource', function($resource) {
		var Place = $resource('/api/place', null, {
				get: { url: '/api/place/get/:id', method: 'GET' },
				list: { url: '/api/place/list', method: 'GET', transformResponse: transformList },
				listShortened: { url: '/api/place/list', method: 'GET', params: { shortened: 1 } },
			});

		return Place;

		function transformList(data, header) {
			var wrapped = angular.fromJson(data);

			angular.forEach(wrapped.list, function (value) {
				if (value.courts) {
					value.summary = va(value.courts)
						.groupBy(function (c) { return c.sport })
						.orderBy(function (c) { return c.key });
				}
			});

			return wrapped;
		}
	}])
	.factory('Sport', ['$resource', function($resource) {
		return $resource('/api/sport', null, {
			list: { url: '/api/sport/list', method: 'GET', isArray: true }
		});
	}]);