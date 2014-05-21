'use strict';

var path = require('path');

module.exports = {
    components: path.join(__dirname, '../../../bower_components'),
    public: path.join(__dirname, '../../client'),
    build: path.join(__dirname, '../../../build'),
    views: path.join(__dirname, '../views')
};