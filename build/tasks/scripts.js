var WebpackNotifierPlugin = require('webpack-notifier');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('scripts-build', function() {
	return gulp.src('src/index.js')
		.pipe($.webpack({
			watch: $.util.env.dev,

			output: {
				filename: 'Rift.js',
				library: 'Rift',
				libraryTarget: 'umd'
			},

			externals: ['superagent'],

			node: {
				process: false,
				setImmediate: false
			},

			plugins: [
				new WebpackNotifierPlugin()
			]
		}))
		.pipe(gulp.dest(''))
		.pipe($.uglify())
		.pipe($.rename({ suffix: '.min' }))
		.pipe(gulp.dest(''));
});

gulp.task('scripts', ['scripts-build']);
