(function(undefined) {
'use strict';

var global = Function('return this;')();

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

var hasOwn = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;

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

var isServer = rt.isServer = typeof window == 'undefined' && typeof navigator == 'undefined';
var isClient = rt.isClient = !isServer;

/**
 * @memberOf Rift
 *
 * @param {*} err
 */
function logError(err) {
	console.error(err === Object(err) && err.stack || err);
}

rt.logError = logError;

var $;

if (isClient) {
	$ = rt.$ = global.jQuery || global.Zepto || global.ender || global.$;
}

var keyListenerInner = '_rt-listenerInner';
