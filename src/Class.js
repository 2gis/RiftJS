(function() {
	var mixin = rt.object.mixin;

	var Class;

	/**
	 * @type {Object<Function>}
	 */
	var classes = rt.classes = Object.create(null);

	/**
	 * @typesign (name: string): Function;
	 */
	function getClass(name) {
		if (!(name in classes)) {
			throw new TypeError('Class "' + name + '" is not defined');
		}

		return classes[name];
	}

	rt.getClass = getClass;

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

	rt.registerClass = registerClass;

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

	rt.EventEmitter.extend = extend;

	Class = {
		classes: classes,
		get: getClass,
		register: registerClass,
		extend: extend
	};

	rt.Class = Class;
})();
