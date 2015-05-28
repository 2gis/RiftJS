var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var config = require('../config');
var helpers = require('../helpers');

gulp.task('scripts-build', function() {
	return gulp.src(config.files)
		.pipe($.plumber(helpers.plumberErrorHandler))
		.pipe($.concat('Rift.js'))
		.pipe(gulp.dest(''))
		.pipe($.uglify())
		.pipe($.rename({ suffix: '.min' }))
		.pipe(gulp.dest(''));
});

gulp.task('scripts', ['scripts-build'], function() {
	if ($.util.env.dev) {
		gulp.watch(config.files, ['scripts-build']);
	}
});
