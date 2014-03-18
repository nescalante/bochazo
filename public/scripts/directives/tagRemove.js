angular.module("bchz").directive(
    'tagRemove', 
    ['$parse',
    function ($parse) {
        'use strict';

        return {
            restrict: 'AE',
            link: function (scope, element, attrs) {
                element.bind('click', function () {
                    var tag = $parse(attrs.tagRemove)(scope),
                        parent = $parse(attrs.tagParent)(scope);

                    scope.$emit('tag.remove', tag, parent);
                });
            }
        }
    }]);