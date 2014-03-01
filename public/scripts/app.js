angular.module('bchz', ['ngRoute', 'ngAnimate', 'bchz.service'])
	.run(function ($rootScope, $http, $location, $window, $q, Sport, appName) {
		$rootScope.sports = Sport.list();
		$rootScope.name = appName;

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

					if (!va(target).contains(currentTag)) {
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
			target = va(target).where(function (t) { return t != tag });

			return target;
		};

		$rootScope.validateTag = function (tag, target) {
			if (target) {
				return va(target)
					.select(function (t) { return t.toLowerCase(); })
					.contains(tag && tag.toLowerCase());
			}
			else {
				return false;
			}
		};
	})
	.config(function ($routeProvider, $locationProvider) {
		$locationProvider.html5Mode(true);

		$routeProvider
			.when('/', { controller: 'HomeCtrl', templateUrl: '/site/home.html' })
			.when('/busqueda', { controller: 'PlaceSearchCtrl', templateUrl: '/place/search.html' })
			.when('/listado', { controller: 'PlaceListCtrl', templateUrl: '/place/list.html' })
			.when('/mapa', { controller: 'MapCtrl', templateUrl: '/site/map.html' })
			.when('/canchas/agregar', { controller: 'PlaceAddCtrl', templateUrl: '/place/add.html' })
			.when('/canchas/listado/:sport', { controller: 'PlaceListCtrl', templateUrl: '/place/list.html' })
			.when('/canchas/listado', { controller: 'PlaceListCtrl', templateUrl: '/place/list.html' })
			.when('/canchas/:id', { controller: 'PlaceDetailCtrl', resolve: {
				place: function ($route, Place) {
					return Place.get($route.current.params).$promise
				}
			}, templateUrl: '/place/detail.html' })
			.when('/404', { templateUrl: '/site/404.html' })
			.otherwise({ templateUrl: '/site/404.html' });
	})
	.constant('appName', 'Bochazo');