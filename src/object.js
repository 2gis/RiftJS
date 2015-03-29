(function() {

	var nextUID = rt.uid.next;

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
	rt.object = {
		getUID: getUID,
		mixin: mixin,
		clone: cloneObject
	};

})();
