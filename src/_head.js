(function(undef) {
'use strict';

var global = Function('return this;')();

/*!
 * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
 */
function svz(a, b) {
	return a === b || a != a && b != b;
}

/* eslint-disable no-unused-vars */
function isEmpty(obj) {
	for (var any in obj) {
		return false;
	}
	return true;
}
/* eslint-enable no-unused-vars */

function emptyFn() {}

var hasOwn = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;

/**
 * @namespace Rift
 */
var _;

if (typeof exports != 'undefined') {
	_ = exports;
} else {
	_ = global.Rift = {};
}

_.global = global;

var isServer = _.isServer = typeof window == 'undefined' && typeof navigator == 'undefined';
var isClient = _.isClient = !isServer;

/**
 * @memberOf Rift
 *
 * @param {*} err
 */
function logError(err) {
	console.error(err === Object(err) && err.stack || err);
}

_.logError = logError;

var $;

if (isClient) {
	$ = _.$ = global.jQuery || global.Zepto || global.ender || global.$;
}

var keyListeningInner = '_rt-listeningInner';
