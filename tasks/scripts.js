
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var helpers = require('./helpers');

var bodyFiles = exports.bodyFiles = [
	'src/es6-object-assign.js', // 3
	'src/uid.js', // 3
	'src/object.js', // 3
	'src/namespace.js', // 3
	'src/regex.js', // 3
	'src/value.js', // 3
	'src/process.js', // 3

	'src/Class.js', // 3

	'src/dump.js', // 3

	'src/Map.js', // 0
	'src/Set.js', // 0
	'src/Event.js', // 3
	'src/EventEmitter.js', // 4
	'src/ActiveDictionary.js', // 3
	'src/ActiveArray.js', // 3
	'src/DataCell.js', // 3
	'src/ActiveProperty.js', // 3
	'src/Cleanable.js', // 3

	'src/BaseModel.js', // 3

	'src/html.js', // 3
	'src/template.js', // 2
	'src/domBinding.js', // 2
	'src/BaseView.js', // 2

	'src/ViewState.js', // 2
	'src/Router.js', // 2

	'src/BaseApp.js' // 2
];

var files = exports.files = [].concat(
	'src/_head.js',
	bodyFiles,
	'src/_tail.js'
);

gulp.task('scripts', function() {
	return gulp.src(files)
		.pipe($.plumber(helpers.plumberErrorHandler))
		.pipe($.concat('Rift.js'))
		.pipe(gulp.dest('build'))
		.pipe($.uglify())
		.pipe($.rename({ suffix: '.min' }))
		.pipe(gulp.dest('build'));
});
