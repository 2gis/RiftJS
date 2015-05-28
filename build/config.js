var bodyFiles = [
	'src/es6-shim.js',
	'src/uid.js',
	'src/object.js',
	'src/namespace.js',
	'src/regex.js',
	'src/value.js',
	'src/process.js',

	'src/Class.js',

	'src/dump.js',

	'src/es6-Map-Set.js',
	'src/Event.js',
	'src/EventEmitter.js',
	'src/ActiveDictionary.js',
	'src/ActiveArray.js',
	'src/DataCell.js',
	'src/ActiveProperty.js',
	'src/Disposable.js',

	'src/BaseModel.js',

	'src/html.js',
	'src/template.js',
	'src/domBinding.js',
	'src/BaseView.js',

	'src/ViewState.js',
	'src/Router.js',

	'src/BaseApp.js'
];
var files = [].concat(
	'src/_head.js',
	bodyFiles,
	'src/_tail.js'
);

var config = {
	bodyFiles: bodyFiles,
	files: files
};

module.exports = config;
