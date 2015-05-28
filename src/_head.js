(function(undefined) {
'use strict';

var global = Function('return this;')();

/**
 * @namespace Rift
 */
var rt;

if (typeof exports != 'undefined') {
	rt = exports;
} else {
	rt = global.Rift = global.rt = {};
}

rt.global = global;

var KEY_INNER = rt.KEY_INNER = '_rt-inner';
var KEY_USED = rt.KEY_USED = '_rt-used';
var KEY_DATA_CELLS = '_rt-dataCells';
var KEY_VIEW = '_rt-view';
var KEY_VIEW_ELEMENT_NAME = '_rt-viewElementName';

var isServer = rt.isServer = typeof window == 'undefined' && typeof navigator == 'undefined';
var isClient = rt.isClient = !isServer;

var $ = rt.$ = isClient ? global.jQuery || global.Zepto || global.ender || global.$ : undefined;

var hasOwn = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;

/**
 * @memberOf Rift
 *
 * @param {*} err
 */
function logError(err) {
	console.error(err === Object(err) && err.stack || err);
}

rt.logError = logError;

/*!
 * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
 */
function svz(a, b) {
	return a === b || (a != a && b != b);
}

function isEmpty(obj) {
	/* eslint-disable no-unused-vars */
	for (var any in obj) {
		return false;
	}
	/* eslint-enable no-unused-vars */

	return true;
}
