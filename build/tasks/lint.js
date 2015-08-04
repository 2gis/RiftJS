var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('lint', function() {
	return gulp.src(['src/**/*.js', 'build/**/*.js'])
		.pipe($.jscs())
		.pipe($.eslint())
		.pipe($.eslint.format());
});
