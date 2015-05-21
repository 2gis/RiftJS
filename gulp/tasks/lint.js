var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var config = require('../config');

gulp.task('lint', function() {
	return gulp.src(config.files)
		.pipe($.concat('Rift.js'))
		.pipe($.jscs())
		.pipe($.eslint())
		.pipe($.eslint.format());
});
