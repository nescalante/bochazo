var bchz = angular.module('bchz', ['ngRoute', 'ngAnimate'])
	.run(function ($rootScope, $http) {
        $rootScope.sports = [];

        $http({ method: 'GET', url: 'api/sport/list' }).success(function (data, status, xhr) {
            $rootScope.sports = data;
        });
    })
	.config(function ($routeProvider) {
		$routeProvider
			.when('/', { controller: HomeCtrl, templateUrl: 'place/search.html' })
			.when('/canchas/agregar', { controller: PlaceAddCtrl, templateUrl: 'place/add.html' })
			.when('/canchas/listado/:sport', { controller: PlaceListCtrl, templateUrl: 'place/list.html' })
			.when('/canchas/listado', { controller: PlaceListCtrl, templateUrl: 'place/list.html' })
			.when('/canchas/:name', { controller: PlaceDetailCtrl, templateUrl: 'place/detail.html' })
			.otherwise({ redirectTo: '/' });
	});