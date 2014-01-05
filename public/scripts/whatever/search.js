function SearchCtrl($scope, $location) {
    $scope.search = function () {
        $location.path('/canchas/' + ($scope.query || ''));
    };
}