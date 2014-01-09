var bchz = angular.module('bchz', ['ngRoute', 'ngAnimate'])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', { controller: HomeCtrl, templateUrl: 'place/search.html' })
            .when('/canchas/agregar', { controller: PlaceAddCtrl, templateUrl: 'place/add.html' })
            .when('/canchas/:name', { controller: PlaceDetailCtrl, templateUrl: 'place/detail.html' })
            .when('/canchas/', { controller: PlaceListCtrl, templateUrl: 'place/list.html' })
            .otherwise({ redirectTo: '/' });
    });