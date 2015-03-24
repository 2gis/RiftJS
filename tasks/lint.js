
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var scripts = require('./scripts');

gulp.task('lint', function() {
	return gulp.src(scripts.files)
		.pipe($.concat('Rift.js'))
		.pipe($.jscs())
		.pipe($.eslint())
		.pipe($.eslint.format());
});
