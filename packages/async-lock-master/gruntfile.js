'use strict';

module.exports = function(grunt) {
	// Unified Watch Object
	var watchFiles = {
		libJS: ['gruntfile.js', 'index.js', 'lib/**/*.js'],
		testJS: ['test/**/*.js'],
	};

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		env: {
			test: {
				NODE_ENV: 'test'
			}
		},
		watch: {
			libJS: {
				files: watchFiles.libJS.concat(watchFiles.testJS),
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			}
		},
		jshint: {
			all: {
				src: watchFiles.libJS.concat(watchFiles.testJS),
				options: {
					jshintrc: true
				}
			}
		},
		mochaTest: {
			test : {
				src: watchFiles.testJS,
				options : {
					reporter: 'spec',
					timeout: 5000,
					noFail: false
				}
			},
		}
	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);

	// Lint task(s).
	grunt.registerTask('lint', ['jshint']);

	// Test task.
	grunt.registerTask('test', ['lint', 'env:test', 'mochaTest']);

	// Default task(s).
	grunt.registerTask('default', ['test']);
};
