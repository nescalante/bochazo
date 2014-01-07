~function (a) {
    a.module('bchz', ['ngRoute', 'ngAnimate'])
        .config(function ($routeProvider) {
            $routeProvider
                .when('/', { controller: HomeCtrl, templateUrl: 'place/search.html' })
                .when('/canchas/agregar', { controller: PlaceAddCtrl, templateUrl: 'place/add.html' })
                .when('/canchas/:name', { controller: PlaceDetailCtrl, templateUrl: 'place/detail.html' })
                .when('/canchas/', { controller: PlaceListCtrl, templateUrl: 'place/list.html' })
                .otherwise({ redirectTo: '/' });
        })
        .directive('ngEnter', function () {
            return function (scope, element, attrs) {
                element.bind("keydown keypress", function (event) {
                    if(event.which === 13) {
                        scope.$apply(function (){
                            scope.$eval(attrs.ngEnter);
                        });

                        event.preventDefault();
                    }
                });
            };
        });
}(angular);