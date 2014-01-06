~function (a) {
    a.module('bchz', ['ngRoute', 'ngAnimate'])
        .config(function ($routeProvider) {
            $routeProvider
                .when('/', { controller: HomeCtrl, templateUrl: 'place/search.html' })
                .when('/canchas/agregar', { controller: PlaceCtrl, templateUrl: 'place/add.html' })
                .when('/canchas/:query', { controller: ListCtrl, templateUrl: 'place/list.html' })
                .when('/canchas/', { controller: ListCtrl, templateUrl: 'place/list.html' })
                .when('/:name', { controller: PlaceCtrl, templateUrl: 'place/detail.html' })
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