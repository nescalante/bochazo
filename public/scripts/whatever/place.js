function PlaceCtrl($http, $scope, $location, $routeParams, getPlaceUrl) {
    var latLng = new google.maps.LatLng(-38, -63),
        mapOptions = { zoom: 15, center: latLng },
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions),
        geocoder = new google.maps.Geocoder();

    if ($routeParams.name) {
        $http({ method: 'GET', url: getPlaceUrl, params: { name: $routeParams.name } }).success(function (data, status, xhr) {
            // bchz.mapping.get('Place', data, $scope);

            var placeLatLng = new google.maps.LatLng($scope.latitude, $scope.longitude);
            
            map.setCenter(placeLatLng);

            var marker = new google.maps.Marker({
                position: map.getCenter(),
                map: map,
                title: $scope.description
            });

        }).error(function () {
            $location.path('/canchas/');
        });
    }

    $scope.save = function () {

    };

    $scope.setAddress = function (address, assignAddress) {
        var latLng = new google.maps.LatLng(address.latitude, address.longitude);

        if (map.marker) {
            map.marker.setMap(null);
        }

        map.marker = new google.maps.Marker({ map: map, title: $scope.description, position: latLng });
        map.marker.setDraggable(true);
        map.setCenter(latLng);

        google.maps.event.addListener(map.marker, 'position_changed', function () {
            geocoder.geocode({ latLng: map.marker.getPosition() }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var addressResults = mapResults(results);

                    assignResult(addressResults[0]);
                    $scope.$apply();
                }
            });
        });

        assignResult($scope.addressResults[0], assignAddress);
    };

    $scope.addressSearch = function () {
        $scope.addressResults = [];

        geocoder.geocode({ address: $scope.address }, function (results, status) {
            $scope.showMap = status == google.maps.GeocoderStatus.OK;

            if ($scope.showMap) {
                $scope.addressResults = mapResults(results);
                $scope.setAddress($scope.addressResults[0], false);
            }

            $scope.$apply();
        });
    };

    function mapResults(results) {
        return results.map(function (i) {
            return {
                address: i.formatted_address,
                latitude: i.geometry.location.lat(),
                longitude: i.geometry.location.lng(),
                addressComponents: i.address_components.map(function (c) {
                    return {
                        shortName: c.short_name,
                        longName: c.long_name,
                        types: c.types
                    };
                })
            };
        });
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