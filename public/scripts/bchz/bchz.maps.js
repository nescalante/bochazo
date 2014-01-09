~function(m) {
    var geocoder = new google.maps.Geocoder(),
        mapResults = function (results) {
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
        };

    m.addMarker = function addMarker(options) {
        var map = this;

        if (options.latLng || (options.latitude != null && options.longitude != null)) {
            var latLng = options.latLng || new google.maps.LatLng(options.latitude, options.longitude);

            if (map.marker) {
                map.marker.setMap(null);
            }

            map.marker = new google.maps.Marker({ 
                map: map,
                title: options.description, 
                position: latLng 
            });
            map.marker.setDraggable(true);
            map.setCenter(latLng);

            if (options.zoom) {
                map.setZoom(options.zoom);
            }

            if (options.drag) {
                google.maps.event.addListener(map.marker, 'position_changed', function () {
                    geocoder.geocode({ latLng: map.marker.getPosition() }, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            var mappedResults = mapResults(results);

                            options.drag(mappedResults);
                        }
                    });
                });
            }
        }
        else if (options.address) {
            geocoder.geocode({ address: options.address }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var mappedResults = mapResults(results);

                    options.latitude = mappedResults[0].latitude;
                    options.longitude = mappedResults[0].longitude;

                    if (options.success) {
                        options.success(mappedResults);
                    }

                    addMarker.bind(map, options)();
                }
                else {
                    if (options.error) {
                        options.error(status);
                    }
                }

                if (options.complete) {
                    options.complete(results, status);
                }
            });
        }
    };


}(google.maps.Map.prototype);