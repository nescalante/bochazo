~function (a) {
    a.module('bchz', ['ngRoute', 'ngAnimate'])
        .value('getPlaceUrl', '/api/place/get')
        .value('listPlacesUrl', '/api/place/list')
        .config(function ($routeProvider) {
            $routeProvider
                .when('/', { controller: HomeCtrl, templateUrl: 'place/search.html' })
                .when('/canchas/agregar', { controller: PlaceCtrl, templateUrl: 'place/add.html' })
                .when('/canchas/:query', { controller: ListCtrl, templateUrl: 'place/list.html' })
                .when('/canchas/', { controller: ListCtrl, templateUrl: 'place/list.html' })
                .when('/:name', { controller: PlaceCtrl, templateUrl: 'place/detail.html' })
                .otherwise({ redirectTo: '/' });
        });
}(angular)