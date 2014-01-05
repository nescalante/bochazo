function ListCtrl($http, $scope, $location, $routeParams, listPlacesUrl) {
    $scope.places = [];
    $scope.showMore = function () {
        if ($scope.count != $scope.places.length) {
            $scope.loading = true;
            $http({ method: 'GET', url: listPlacesUrl, params: { init: $scope.places.length, query: $routeParams.query } }).success(function (data, status, xhr) {
                $scope.count = data.count;
                $scope.loading = false;
                data.list.each(function (ix, item) {
                    $scope.places.push(item);
                });
            });
        }
    };

    $scope.showMore();
}