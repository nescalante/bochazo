function PlaceCtrl($http, $scope, $location, $routeParams) {
    var latLng = new google.maps.LatLng(-38, -63),
        mapOptions = { zoom: 4, center: latLng },
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions),
        geocoder = new google.maps.Geocoder();

    if ($routeParams.name) {
        $http({ method: 'GET', url: '/api/place/get', params: { name: $routeParams.name } }).success(function (data, status, xhr) {
            addMarker({
                latitude: data.latitude,
                longitude: data.longitude,
                map: map,
                zoom: 15
            });
        }).error(function () {
            $location.path('/canchas/');
        });
    } else {
        addMarker({
            latLng: latLng,
            map: map,
            onDrag: function (results) {
                var addressResults = mapResults(results);

                assignResult(addressResults[0]);
                $scope.$apply();
            }
        });
    }

    $scope.save = function () {
        $http({ method: 'POST', url: '/api/place/insert', data: { 
            description: $scope.description,
            info: $scope.info,
            phone: $scope.phone,
            address: $scope.address,
            addressComponents: $scope.addressComponents,
            howToArrive: $scope.howToArrive
        } }).success(function (err) {
            console.log(err);
        });
    };

    $scope.setAddress = function (address, assignAddress) {
        addMarker({
            latitude: address.latitude,
            longitude: address.longitude,
            map: map,
            description: $scope.description,
            zoom: 15,
            onDrag: function (results) {
                var addressResults = mapResults(results);

                assignResult(addressResults[0]);
                $scope.$apply();
            }
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

    function addMarker(options) {
        var latLng = options.latLng || new google.maps.LatLng(options.latitude, options.longitude);

        if (!options.map) {
            throw "map is required";
        }

        if (options.map.marker) {
            options.map.marker.setMap(null);
        }

        options.map.marker = new google.maps.Marker({ 
            map: options.map, 
            title: options.description, 
            position: latLng 
        });
        options.map.marker.setDraggable(true);
        options.map.setCenter(latLng);

        if (options.zoom) {
            options.map.setZoom(options.zoom);
        }

        if (options.onDrag) {
            google.maps.event.addListener(options.map.marker, 'position_changed', function () {
                geocoder.geocode({ latLng: options.map.marker.getPosition() }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        options.onDrag(results);
                    }
                });
            });
        }
    }

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