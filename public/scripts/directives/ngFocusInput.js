~function (b) {
	b.directive('ngFocusInput', function($timeout) {
		return {
			link: function(scope, element, attrs) {
				element.bind('click', function() {
					$timeout(function() {
						element.find('input')[0].focus();
					});
				});
    		}
  		};
	});
}(bchz);