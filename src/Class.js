(function() {

	var mixin = rt.object.mixin;

	/**
	 * @namespace Rift.Class
	 */
	var Class;

	/**
	 * @property {Object<Function>}
	 * @memberOf Rift.Class
	 */
	var classes = Object.create(null);

	/**
	 * @function getOrError
	 * @memberOf Rift.Class
	 *
	 * @param {string} name
	 * @returns {Function}
	 */
	function getClassOrError(name) {
		if (!(name in classes)) {
			throw new TypeError('Class "' + name + '" is not defined');
		}

		return classes[name];
	}

	/**
	 * @function register
	 * @memberOf Rift.Class
	 *
	 * @param {string} name
	 * @param {Function} cl
	 * @returns {Function}
	 */
	function registerClass(name, cl) {
		if (name in classes) {
			throw new TypeError('Class "' + name + '" is already registered');
		}

		Object.defineProperty(cl, '__class', {
			value: name
		});

		classes[name] = cl;

		return cl;
	}

	/**
	 * @memberOf Rift.Class
	 *
	 * @this {Function} - Родительский класс.
	 * @param {string} [name] - Внутреннее имя.
	 * @param {Object} declaration - Объект-объявление.
	 * @param {Object} [declaration.static] - Статические свойства.
	 * @param {Function} [declaration.constructor] - Конструктор.
	 * @returns {Function}
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

		Object.defineProperty(constr, '$super', {
			writable: true,
			value: parent.prototype
		});

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

		if (constr.extend === undefined) {
			constr.extend = extend;
		}

		mixin(proto, declaration);

		if (name) {
			registerClass(name, constr);
		}

		return constr;
	}

	Class = {
		classes: classes,
		getOrError: getClassOrError,
		register: registerClass,
		extend: extend
	};

	rt.Class = Class;

})();
