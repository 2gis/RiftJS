var del = require('del');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('docs', function() {
	del.sync('docs/api');

	return gulp.src('Rift.js')
		.pipe($.jsdoc.parser({
			plugins: ['plugins/markdown']
		}))
		.pipe($.jsdoc.generator('docs/api', {
			applicationName: 'Rift'
		}));
});
