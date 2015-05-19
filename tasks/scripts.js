var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var helpers = require('./helpers');

var bodyFiles = exports.bodyFiles = [
	'./src/es6-shim.js', // 4
	'./src/uid.js', // 4
	'./src/object.js', // 3
	'./src/namespace.js', // 3
	'./src/regex.js', // 3
	'./src/value.js', // 4
	'./src/process.js', // 3

	'./src/Class.js', // 3

	'./src/dump.js', // 3

	'./src/es6-Map-Set.js', // 1
	'./src/Event.js', // 4
	'./src/EventEmitter.js', // 4
	'./src/ActiveDictionary.js', // 4
	'./src/ActiveArray.js', // 4
	'./src/DataCell.js', // 3
	'./src/ActiveProperty.js', // 4
	'./src/Disposable.js', // 4

	'./src/BaseModel.js', // 3

	'./src/html.js', // 3
	'./src/template.js', // 2
	'./src/domBinding.js', // 3
	'./src/BaseView.js', // 2

	'./src/ViewState.js', // 2
	'./src/Router.js', // 2

	'./src/BaseApp.js' // 2
];

var files = exports.files = [].concat(
	'./src/_head.js',
	bodyFiles,
	'./src/_tail.js'
);

gulp.task('scripts', function() {
	return gulp.src(files)
		.pipe($.plumber(helpers.plumberErrorHandler))
		.pipe($.concat('Rift.js'))
		.pipe(gulp.dest('./build'))
		.pipe($.uglify())
		.pipe($.rename({ suffix: '.min' }))
		.pipe(gulp.dest('./build'));
});
