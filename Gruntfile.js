'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                jshintrc: true
            },
            server: ['app/**/*.js'],
            client: ['public/scripts/**/*.js'],
            test: ['test/*.js']
        },
        mochaTest: {
            test: {
                src: ['test/*.js']
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('default', ['lint', 'test']);
    grunt.registerTask('build', ['lint', 'test']);
};