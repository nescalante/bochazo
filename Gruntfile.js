'use strict';

module.exports = function (grunt) {
    var scripts = [
        '<%= dirs.scripts %>/extensions/*.js', 
        '<%= dirs.scripts %>/app/*.js',
        '<%= dirs.scripts %>/directives/*.js', 
        '<%= dirs.scripts %>/modules/services/*.js', 
        '<%= dirs.scripts %>/whatever/place/*.js', 
        '<%= dirs.scripts %>/whatever/site/*.js', 
        '<%= dirs.scripts %>/whatever/*.js'
    ];

    var libs = [
        '<%= dirs.components %>/jquery/dist/jquery.js', 
        '<%= dirs.components %>/angular/angular.js', 
        '<%= dirs.components %>/angular-animate/angular-animate.js', 
        '<%= dirs.components %>/angular-resource/angular-resource.js', 
        '<%= dirs.components %>/angular-route/angular-route.js', 
        '<%= dirs.components %>/very-array/src/very-array.js', 
        '<%= dirs.components %>/bootstrap/js/collapse.js', 
        '<%= dirs.components %>/bootstrap/js/dropdown.js', 
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            client: 'src/client',
            scripts: 'src/client/scripts',
            styles: 'src/client/styles',
            images: 'src/client/images',
            deploy: 'build',
            components: 'bower_components'
        },
        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                jshintrc: true
            },
            server: ['src/server/**/*.js'],
            client: ['<%= dirs.scripts %>/**/*.js'],
            test: ['test/*.js']
        },
        lesslint: {
            src: ['<%= dirs.styles %>/site/bootstrap.less', '<%= dirs.styles %>/site/site.less']
        },
        mochaTest: {
            test: {
                src: ['test/*.js']
            }
        },
        clean: {
            bootstrap: ['<%= dirs.styles %>/bootstrap'],
            deploy: ['<%= dirs.deploy %>']
        },
        copy: {
            hint: {
                src: '<%= dirs.components %>/hint.css/hint.min.css',
                dest: '<%= dirs.deploy %>/hint.css'
            },
            bootstrap: {
                cwd: '<%= dirs.components %>/bootstrap/less/',
                src: '**',
                dest: '<%= dirs.styles %>/bootstrap/',
                expand: true
            },
            fonts: {
                cwd: '<%= dirs.components %>/bootstrap/dist/fonts/',
                src: '**',
                dest: '<%= dirs.deploy %>/fonts/',
                expand: true
            },
            variables: {
                src: '<%= dirs.styles %>/site/variables.less',
                dest: '<%= dirs.styles %>/bootstrap/variables.less'
            },
            opensearch: {
                src: '<%= dirs.client %>/opensearch.xml',
                dest: '<%= dirs.deploy %>/opensearch.xml',
            },
            images: {
                cwd: '<%= dirs.images %>/',
                src: '**',
                dest: '<%= dirs.deploy %>/images/',
                expand: true
            },
        },
        less: {
            development: {
                files: {
                    '<%= dirs.deploy %>/site.css': '<%= dirs.styles %>/site/all.less',
                },
                options: {
                    sourceMap: true,
                    sourceMapFilename: '<%= dirs.deploy %>/site.css.map',
                    sourceMapBasepath: '<%= dirs.styles %>'
                }
            },
            production: {
                files: {
                    '<%= dirs.deploy %>/site.css': '<%= dirs.styles %>/site/all.less',
                },
                options: {
                    cleancss: true
                }
            }
        },
        concat: {
            options: {
                banner: '(function (angular) {' + grunt.util.linefeed + grunt.util.linefeed, 
                footer: grunt.util.linefeed + '})(angular);',
                separator: grunt.util.linefeed + grunt.util.linefeed
            },
            main: {
                src: scripts.concat(libs),
                dest: '<%= dirs.deploy %>/bchz.js'
            }
        },
        uglify: {
            development: {
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    compress: false,
                },
                files: {
                    '<%= dirs.deploy %>/bchz.js': scripts,
                    '<%= dirs.deploy %>/libs.js': libs
                }
            },
            production: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> */' + grunt.util.linefeed + grunt.util.linefeed
                },
                files: {
                    '<%= dirs.deploy %>/bchz.js': ['<%= dirs.deploy %>/bchz.js']
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('init:lint', ['clean'])
    grunt.registerTask('lint', ['copy:bootstrap', 'copy:variables', 'jshint', 'lesslint']);
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('components', ['copy:hint', 'copy:fonts', 'copy:images', 'copy:opensearch']);
    grunt.registerTask('compile:dev', ['less:development', 'clean:bootstrap', 'concat', 'components']);
    grunt.registerTask('compile:prod', ['less:production', 'clean:bootstrap', 'concat', 'uglify:production', 'components']);
    
    grunt.registerTask('default', ['lint', 'test']);
    grunt.registerTask('build', ['clean', 'lint', 'test', 'compile:dev']);
    grunt.registerTask('deploy', ['clean', 'lint', 'test', 'compile:prod']);
};