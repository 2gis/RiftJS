(function() {

	var nextUID = _.uid.next;

	var keyUID = '_rt-uid';

	/**
	 * Получает уникальный идентификатор объекта.
	 *
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @param {string} [prefix]
	 * @returns {string}
	 */
	function getUID(obj, prefix) {
		if (!hasOwn.call(obj, keyUID)) {
			Object.defineProperty(obj, keyUID, {
				value: nextUID(prefix)
			});
		}

		return obj[keyUID];
	}

	/**
	 * Получает дескрипторы перечисляемых свойств (в том числе унаследованых).
	 *
	 * @memberOf Rift.object
	 *
	 * @example
	 * var obj = { __proto__: { inheritedProperty: 1 }, property: 1 };
	 *
	 * console.log(Object.getOwnPropertyDescriptor(obj, 'inheritedProperty'));
	 * // => undefined
	 *
	 * console.log(getPropertyDescriptors(obj));
	 * // => { inheritedProperty: { value: 1, ... }, property: { value: 1, ... } }
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function getPropertyDescriptors(obj) {
		var names = {};
		var nameCount = 0;

		for (var name in obj) {
			names[name] = true;
			nameCount++;
		}

		if (!nameCount) {
			return {};
		}

		var descrs = {};

		while (true) {
			for (var name in names) {
				if (hasOwn.call(obj, name)) {
					descrs[name] = Object.getOwnPropertyDescriptor(obj, name);
					delete names[name];
					nameCount--;
				}
			}

			if (!nameCount) {
				return descrs;
			}

			obj = Object.getPrototypeOf(obj);
		}
	}

	/**
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function getDataPropertyValues(obj) {
		var descrs = getPropertyDescriptors(obj);
		var values = {};

		for (var name in descrs) {
			if (hasOwn.call(descrs[name], 'value')) {
				values[name] = descrs[name].value;
			}
		}

		return values;
	}

	/**
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @param {Object} source
	 * @param {boolean} [skipDontEnum=false]
	 * @returns {Object}
	 */
	function mixin(obj, source, skipDontEnum) {
		var names = Object[skipDontEnum ? 'keys' : 'getOwnPropertyNames'](source);

		for (var i = names.length; i;) {
			Object.defineProperty(obj, names[--i], Object.getOwnPropertyDescriptor(source, names[i]));
		}

		return obj;
	}

	/**
	 * @function clone
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function cloneObject(obj) {
		return mixin(Object.create(Object.getPrototypeOf(obj)), obj);
	}

	/**
	 * @namespace Rift.object
	 */
	_.object = {
		getUID: getUID,
		getPropertyDescriptors: getPropertyDescriptors,
		getDataPropertyValues: getDataPropertyValues,
		mixin: mixin,
		clone: cloneObject
	};

})();
