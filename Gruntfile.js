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
            src: ['public/styles/site/bootstrap.less', 'public/styles/site/site.less']
        },
        mochaTest: {
            test: {
                src: ['test/*.js']
            }
        },
        clean: {
            bootstrap: ['public/styles/bootstrap'],
            fonts: ['public/fonts'],
            css: ['public/styles/site.css', 'public/styles/site.css.map']
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
                dest: 'public/fonts/',
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
                    'public/styles/site.css': 'public/styles/site/all.less',
                },
                options: {
                    sourceMap: true,
                    sourceMapFilename: 'public/styles/site.css.map',
                    sourceMapBasepath: 'public/styles'
                }
            },
            production: {
                files: {
                    'public/styles/site.css': 'public/styles/site/all.less'
                },
                options: {
                    cleancss: true
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('init', ['clean', 'copy:bootstrap', 'copy:fonts', 'copy:variables'])
    grunt.registerTask('lint', ['jshint', 'lesslint']);
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('compile', ['less:development']);
    grunt.registerTask('default', ['lint', 'test']);
    grunt.registerTask('build', ['init', 'lint', 'test', 'compile']);
    grunt.registerTask('deploy', ['init', 'lint', 'test', 'less:production', 'clean:bootstrap']);
};