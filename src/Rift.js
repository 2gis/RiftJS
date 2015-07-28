(function(undefined) {
	'use strict';

	var hasOwn = Object.prototype.hasOwnProperty;
	var toString = Object.prototype.toString;
	var slice = Array.prototype.slice;
	var reduce = Array.prototype.reduce;

	var global = Function('return this;')();

	var rt;

	if (typeof exports == 'object') {
		rt = exports;
	} else {
		rt = global.Rift = global.rt = {};
	}

	rt.global = global;

	var cellx = (function(exports, module) {
		// gulp-include
		//= include ../node_modules/cellx/cellx.js

		return exports.cellx;
	})({});

	rt.nextTick = cellx.nextTick;
	rt.EventEmitter = cellx.EventEmitter;

	rt.ActiveMap = cellx.ActiveMap;
	rt.map = cellx.map;
	rt.ActiveList = cellx.ActiveList;
	rt.list = cellx.list;

	rt.cellx = cellx;
	rt.cell = cellx;

	rt.Cell = cellx.Cell;

	var KEY_UID = '__rt_uid__';
	var KEY_DATA_CELLS = '__rt_dataCells__';
	var KEY_VIEW = '__rt_view__';
	var KEY_VIEW_ELEMENT_NAME = '__rt_viewElementName__';

	if (global.Symbol && typeof Symbol.iterator == 'symbol') {
		KEY_UID = Symbol(KEY_UID);
		KEY_DATA_CELLS = Symbol(KEY_DATA_CELLS);
		KEY_VIEW = Symbol(KEY_VIEW);
		KEY_VIEW_ELEMENT_NAME = Symbol(KEY_VIEW_ELEMENT_NAME);
	}

	rt.KEY_UID = KEY_UID;
	rt.KEY_DATA_CELLS = KEY_DATA_CELLS;
	rt.KEY_VIEW = KEY_VIEW;
	rt.KEY_VIEW_ELEMENT_NAME = KEY_VIEW_ELEMENT_NAME;

	var isServer = rt.isServer = typeof window == 'undefined' && typeof navigator == 'undefined';
	var isClient = rt.isClient = !isServer;

	var $ = rt.$ = isClient ? global.jQuery || global.Zepto || global.ender || global.$ : undefined;

	/**
	 * @typesign (err);
	 */
	function logError(err) {
		console.error(err === Object(err) && err.stack || err);
	}

	rt.logError = logError;

	// gulp-include
	//= include ./uid.js
	//= include ./object.js
	//= include ./regex.js
	//= include ./Class.js
	//= include ./dump.js
	//= include ./bindCells.js
	//= include ./Disposable.js
	//= include ./BaseModel.js
	//= include ./domBinding.js
	//= include ./BaseView.js
	//= include ./template.js
	//= include ./ViewList.js
	//= include ./ViewSwitch.js
	//= include ./ViewState.js
	//= include ./Router.js
	//= include ./BaseApp.js
})();
