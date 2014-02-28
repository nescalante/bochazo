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
	.factory('InfoWindow', ['$http', '$compile', '$rootScope', '$cacheFactory', function ($http, $compile, $rootScope, $cacheFactory) {
		return {
			get: function get (place, callback) {
				var cache = $cacheFactory.get('iw') || $cacheFactory('iw'),
					template = cache.get('template');

				if (template) {
					initialize();
				}
				else {
					$http.get('/place/info.html').success(function (html) {
						cache.put('template', html);
						get(place, callback);
					});
				}

				function initialize() {
					var iwScope,
						element;

					iwScope = $rootScope.$new(true);
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
				}
			}
		}
	}])
	.factory('Place', ['$resource', '$cacheFactory', '$log', 'InfoWindow', function($resource, $cacheFactory, $log, InfoWindow) {
		var Place = $resource('/api/place', null, {
				get: { url: '/api/place/get/:id', method: 'GET' },
				list: { url: '/api/place/list', method: 'GET', transformResponse: transformList },
				listShortened: { url: '/api/place/list', method: 'GET', params: { shortened: 1 }, transformResponse: transformList },
			});

		Place.prototype.appendMarker = function (map) {
			var item = this,
				iw,
				marker = map.addMarker({
					latitude: item.latitude,
					longitude: item.longitude,
					description: item.description,
					clearLast: false,
					setCenter: false,
					zoom: 6
				}),
				iwCache = $cacheFactory.get('iw') || $cacheFactory('iw');

			item.open = function () {
				var last = iwCache.get('last');

				if (iw) {
					iw.open(map, marker);

					last && last != iw && last.close();
					iwCache.put('last', iw);
				}
			}

			google.maps.event.addListener(marker, 'click', function() {
				if (iw) {
					item.open();
				}
				else {
					Place.get({ id: item._id }, function (place) {
						InfoWindow.get(place, function (result) {
							iw = result;
							item.open();
						});
					});
				}
			});
		};

		Place.fillMap = function fillMap(map, query, limit) {
			if (!limit || limit > query.skip) {
				Place.listShortened(query, function (data) {
					angular.forEach(data.list, function (item) {
						item.appendMarker(map);
					});

					query.skip = (query.skip || 0) + data.list.length;

					if (data.list.length > 0) {
						fillMap(map, query, data.count);
					}
					else {
						delete query.skip;
					}
				}, function (err) { 
					$log.error('Could not get data from server', err);
				});
			}
			else {
				delete query.skip;
			}
		}

		return Place;

		function transformList(data, header) {
			var wrapped = angular.fromJson(data);

			angular.forEach(wrapped.list, function (value, index) {
				if (value.courts) {
					value.summary = va(value.courts)
						.groupBy(function (c) { return c.sport })
						.orderBy(function (c) { return c.key });
				}

				wrapped.list[index] = new Place(value);
			});

			return wrapped;
		}
	}])
	.factory('Sport', ['$resource', function($resource) {
		return $resource('/api/sport', null, {
			list: { url: '/api/sport/list', method: 'GET', isArray: true }
		});
	}]);