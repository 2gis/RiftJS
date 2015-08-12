var object = require('./object');

var mixin = object.mixin;

var hasOwn = Object.prototype.hasOwnProperty;

/**
 * @typesign (declaration: { static?: Object, constructor?: Function }): Function;
 * @typesign (name?: string, declaration: { static?: Object, constructor?: Function }): Function;
 */
function extend(name, declaration) {
	if (typeof name == 'object') {
		declaration = name;
		name = undefined;
	}

	var parent = this == exports ? Object : this;
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

	return constr;
}

exports.extend = extend;
