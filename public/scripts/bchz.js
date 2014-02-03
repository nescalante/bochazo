var bchz = angular.module('bchz', ['ngRoute', 'ngAnimate', 'ngResource'])
	.run(function ($rootScope, $http, $window) {
        $rootScope.sports = [];

        $http({ method: 'GET', url: 'api/sport/list' }).success(function (data, status, xhr) {
            $rootScope.sports = data;
        });


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
	.value('geolocation', {
		get: function get(callback) { 
			if (bchz.coords) {
				callback(bchz.coords);
			}
			else if (navigator && navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function (position) {
					bchz.coords = position.coords;

					callback({ 
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy
					 });
				}, callback);
			} 
			else {
				callback();
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
			.when('/', { controller: HomeCtrl, templateUrl: 'place/search.html' })
			.when('/busqueda', { controller: PlaceSearchCtrl, templateUrl: 'place/search.html' })
			.when('/listado', { controller: PlaceListCtrl, templateUrl: 'place/list.html' })
			.when('/canchas/agregar', { controller: PlaceAddCtrl, templateUrl: 'place/add.html' })
			.when('/canchas/listado/:sport', { controller: PlaceListCtrl, templateUrl: 'place/list.html' })
			.when('/canchas/listado', { controller: PlaceListCtrl, templateUrl: 'place/list.html' })
			.when('/canchas/:name', { controller: PlaceDetailCtrl, templateUrl: 'place/detail.html' })
			.otherwise({ redirectTo: '/' });
	});