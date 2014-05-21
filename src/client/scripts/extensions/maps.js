(function (google) {
    'use strict';

    if (!google) return;

    (function(m) {
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

        m.fix = function () {
            var map = this;

            setTimeout(function () {
                google.maps.event.trigger(map, 'resize');
            }, 1);
        };

        m.addMarker = function addMarker(options) {
            var map = this;

            if (options.latLng || (options.latitude && options.longitude)) {
                var latLng = options.latLng || new google.maps.LatLng(options.latitude, options.longitude),
                    marker = new google.maps.Marker({ 
                        flat: false,
                        map: map,
                        title: options.description, 
                        position: latLng 
                    });
                
                // fixes map size bugs
                if (options.setCenter === undefined || options.setCenter === true) {
                    map.setCenter(latLng); 
                }

                if (options.zoom) {
                    map.setZoom(options.zoom);
                }

                if (options.drag) {
                    marker.setDraggable(true);
                    
                    google.maps.event.addListener(marker, 'position_changed', function () {
                        geocoder.geocode({ latLng: marker.getPosition() }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                var mappedResults = mapResults(results);

                                options.drag(mappedResults);
                            }
                        });
                    });
                }

                if (options.cleanLast && map.marker) {
                    map.marker.setMap(null);
                }

                map.marker = marker;
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

            return map.marker;
        };
    })(google.maps.Map.prototype);
})(typeof google !== 'undefined' && google);