var cellx = require('cellx');
var object = require('./object');

var mixin = object.mixin;

var hasOwn = Object.prototype.hasOwnProperty;

/**
 * @type {Object<Function>}
 */
var classes = Object.create(null);

exports.classes = classes;

/**
 * @typesign (name: string): Function;
 */
function getClass(name) {
	if (!(name in classes)) {
		throw new TypeError('Class "' + name + '" is not defined');
	}

	return classes[name];
}

exports.get = getClass;

/**
 * @typesign (name: string, cl: Function): Function;
 */
function registerClass(name, cl) {
	if (name in classes) {
		throw new TypeError('Class "' + name + '" is already registered');
	}

	Object.defineProperty(cl, '$class', {
		value: name
	});

	classes[name] = cl;

	return cl;
}

exports.register = registerClass;

var Class = exports;

/**
 * @typesign (declaration: { static?: Object, constructor?: Function }): Function;
 * @typesign (name?: string, declaration: { static?: Object, constructor?: Function }): Function;
 */
function extend(name, declaration) {
	if (typeof name == 'object') {
		declaration = name;
		name = undefined;
	}

	var parent = this == Class ? Object : this;
	var constr;

	if (hasOwn.call(declaration, 'constructor')) {
		constr = declaration.constructor;
		delete declaration.constructor;
	} else {
		constr = parent == Object ?
			function() {} :
			function() {
				return parent.apply(this, arguments);
			};
	}

	var proto = Object.create(parent.prototype);

	constr.prototype = proto;

	Object.defineProperty(proto, 'constructor', {
		configurable: true,
		writable: true,
		value: constr
	});

	Object.keys(parent).forEach(function(name) {
		Object.defineProperty(constr, name, Object.getOwnPropertyDescriptor(parent, name));
	});

	if (hasOwn.call(declaration, 'static')) {
		mixin(constr, declaration.static);
		delete declaration.static;
	}

	if (!constr.extend) {
		constr.extend = extend;
	}

	mixin(proto, declaration);

	if (name) {
		registerClass(name, constr);
	}

	return constr;
}

exports.extend = extend;

cellx.EventEmitter.extend = extend;
