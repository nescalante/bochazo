angular.module("bchz").directive(
	'ngComma', 
	function () {
		'use strict';

		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if(event.which === 44) {
					scope.$apply(function (){
						scope.$eval(attrs.ngEnter);
					});

					event.preventDefault();
				}
			});
		};
	});