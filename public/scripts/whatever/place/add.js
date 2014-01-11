function PlaceAddCtrl($http, $scope, $location) {
    var map = new google.maps.Map(document.getElementById('map-add')),
        indexedTypes = [];

    $scope.types = ['Fútbol', 'Tenis', 'Paddle'];
    $scope.floorTypes = ['Sintético', 'Carpeta', 'Caucho'];
    $scope.tags = [];
    $scope.courts = [];

    map.addMarker({
        latitude: -38,
        longitude: -63,
        zoom: 4,
        drag: function (results) {
            assignResult(results[0]);
            
            $scope.$apply();
        }
    });

    $scope.save = function () {
        if ($scope.currentTag) {
            $scope.tags.push($scope.currentTag);
        }

        if ($scope.currentCourt.type && $scope.currentCourt.floor) {
            $scope.courts.push($scope.currentCourt);
        }

        $http({ method: 'POST', url: '/api/place/insert', data: {
            name: $scope.description,
            description: $scope.description,
            info: $scope.info,
            phone: $scope.phone,
            address: $scope.address,
            latitude: $scope.latitude,
            longitude: $scope.longitude,
            addressComponents: $scope.addressComponents,
            tags: $scope.tags,
            courts: $scope.courts
        } }).success(function () {
            $location.path('/canchas/' + $scope.description);
        });
    };

    $scope.setAddress = function (address) {
        map.addMarker({
            latitude: address.latitude,
            longitude: address.longitude,
            description: $scope.description,
            zoom: 15,
            drag: function (results) {
                assignResult(results[0]);

                $scope.$apply();
            }
        });

        assignResult(address);
    };

    $scope.addressSearch = function () {
        if ($scope.address) {
            $scope.addressResults = [];
            $scope.loadingAddress = true;

            map.addMarker({
                address: $scope.address,
                description: $scope.description,
                zoom: 15,
                drag: function (results) {
                    assignResult(results[0]);

                    $scope.$apply();
                },
                success: function (results) {
                    assignResult(results[0], false);

                    $scope.addressResults = results;
                },
                complete: function () {
                    $scope.loadingAddress = false;
                    $scope.$apply();
                }
            });
        }
    };

    $scope.addTag = function (tag) {
        if (tag && !$scope.tags.contains(tag)) {
            $scope.tags.push(tag);
            $scope.currentTag = "";
        }
    };

    $scope.removeTag = function (tag) {
        $scope.tags = $scope.tags.where(function (t) { return t != tag });
    };

    $scope.validateTag = function (tag) {
        return $scope.tags
            .select(function (t) { return t.toLowerCase(); })
            .contains(tag && tag.toLowerCase());
    };

    $scope.$watchCollection('courts', function() {
        $scope.groupedCourts = $scope.courts
            .groupBy(function (c) { return c.type });
    });

    $scope.addCourt = function(court) {
        $scope.courts.push(court);
        $scope.currentCourt = {};
    }

    function assignResult(result, assignAddress) {
        if (assignAddress !== false) {
            $scope.address = result.address;    
            $scope.addressResults = [];
        }
        
        $scope.addressComponents = result.addressComponents;
        $scope.latitude = result.latitude;
        $scope.longitude = result.longitude;
    }
}