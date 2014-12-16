angular.module('bchz').directive(
    'ngFocusInput', 
    ['$timeout', function($timeout) {
        'use strict';

        return {
            link: function(scope, element, attrs) {
                element.bind('click', function() {
                    $timeout(function() {
                        element.find('input')[0].focus();
                    });
                });
            }
        };
    }]);