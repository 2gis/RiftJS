var gulp = require('gulp');
var gutil = require('gulp-util');
var tasks = require('require-dir')('./tasks');

gulp.task('default', ['scripts'], function() {
	if (gutil.env.dev) {
		gulp.watch(tasks.scripts.files, ['scripts']);
	}
});
