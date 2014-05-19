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
        lesslint: {
            src: ['public/styles/site/*.less']
        },
        mochaTest: {
            test: {
                src: ['test/*.js']
            }
        },
        copy: {
            bootstrap: {
                cwd: 'bower_components/bootstrap/less/',
                src: '**',
                dest: 'public/styles/bootstrap/',
                expand: true
            },
            fonts: {
                cwd: 'bower_components/bootstrap/dist/fonts/',
                src: '**',
                dest: 'public/styles/fonts/',
                expand: true
            },
            variables: {
                src: 'public/styles/site/variables.less',
                dest: 'public/styles/bootstrap/variables.less'
            }
        },
        less: {
            development: {
                files: {
                    'public/styles/site.css': 'public/styles/site/site.less',
                    'public/styles/bootstrap.css': 'public/styles/bootstrap/bootstrap.less',
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('lint', ['copy:bootstrap', 'copy:fonts', 'copy:variables', 'jshint', 'lesslint']);
    grunt.registerTask('compileless', [])
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('default', ['lint', 'test']);
    grunt.registerTask('build', ['lint', 'test']);
};