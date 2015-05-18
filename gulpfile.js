var argv = require('yargs').argv;

var gulp = require('gulp');
var tasks = require('require-dir')('./tasks');

gulp.task('default', ['scripts'], function() {
	if (argv.dev) {
		gulp.watch(tasks.scripts.files, ['scripts']);
	}
});
