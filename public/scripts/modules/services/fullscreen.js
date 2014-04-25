angular.module('bchz.service').factory(
    'fullScreen', 
    ['$rootScope', 
    function ($rootScope) {
        'use strict';

        return function set(scope, map) {
            $rootScope.fullScreen = true;

            scope.$on('$destroy', function () { 
                $rootScope.fullScreen = false;
            });

            scope.$on('$viewContentLoaded', function () { 
                map.fix();
            });
        };
    }]);