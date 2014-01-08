function SearchCtrl($scope, $location) {
    $scope.search = function () {
        $location.path('/canchas').search({ 'query': $scope.query || '' });
    };
}