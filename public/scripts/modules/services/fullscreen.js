angular.module('bchz.service').factory(
    'fullScreen', 
    ['$rootScope', 
    function ($rootScope) {
        'use strict';

        return function set(scope, map, hideFooter) {
            $rootScope.fullScreen = true;

            if (hideFooter) {
                $rootScope.hideFooter = true;
            }

            scope.$on('$destroy', function () { 
                $rootScope.fullScreen = false;
            });

            scope.$on('$viewContentLoaded', function () { 
                map.fix();
            });
        };
    }]);