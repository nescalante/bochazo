angular.module('bchz', ['ngRoute', 'ngAnimate', 'bchz.service'])
	.config(function ($routeProvider, $locationProvider) {
		'use strict';

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

angular.module('bchz.service', ['ngResource']);