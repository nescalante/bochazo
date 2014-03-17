angular.module("bchz").run(
	['$rootScope', '$http', '$location', '$window', '$q', 'Sport', 'appName',
	function ($rootScope, $http, $location, $window, $q, Sport, appName) {
		'use strict';

		$rootScope.sports = Sport.list();
		$rootScope.name = appName;

		$rootScope.back = function () {
			$window.history.back();
		};

		$rootScope.addTag = function (tag, target) {
			var tags,
				invalidTags = [];

			if (tag && target) {
				tags = tag.split(',');

				for (var i = 0; i < tags.length; i++) {
					var currentTag = tags[i].trim().toLowerCase();

					if (!va(target).contains(currentTag)) {
						if (currentTag != '') {
							target.push(currentTag);
						}
					}
					else {
						invalidTags.push(currentTag);
					}
				}

				tag = invalidTags.join(', ');
			}

			return tag;
		};

		$rootScope.removeTag = function (tag, target) {
			target = va(target).where(function (t) { return t != tag });

			return target;
		};

		$rootScope.validateTag = function (tag, target) {
			if (target) {
				return va(target)
					.select(function (t) { return t.toLowerCase(); })
					.contains(tag && tag.toLowerCase());
			}
			else {
				return false;
			}
		};
	}]);