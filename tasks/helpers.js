var notifier = require('node-notifier');
var gutil = require('gulp-util');

function plumberErrorHandler(err) {
	gutil.log(err.toString(), '\n' + gutil.colors.red('--------'));
	notifier.notify({ title: err.name, message: err.message });
}

exports.plumberErrorHandler = plumberErrorHandler;
