angular.module("bchz").run(
    ['$rootScope', '$http', '$location', '$window', '$q', 'Sport', 'appName',
    function ($rootScope, $http, $location, $window, $q, Sport, appName) {
        'use strict';

        $rootScope.sports = Sport.list();
        $rootScope.name = appName;

        $rootScope.back = function () {
            $window.history.back();
        };
    }]);