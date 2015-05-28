(function() {

	var nextUID = rt.uid.next;

	/**
	 * Получает уникальный идентификатор объекта.
	 *
	 * @function
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @param {string} [prefix]
	 * @returns {string}
	 */
	var getUID;

	if (typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol') {
		var uidKey = Symbol('uid');

		getUID = function getUID(obj, prefix) {
			return obj[uidKey] || (obj[uidKey] = nextUID(prefix));
		};
	} else {
		var uidKey = '_rt-uid';

		getUID = function getUID(obj, prefix) {
			if (!hasOwn.call(obj, uidKey)) {
				Object.defineProperty(obj, uidKey, {
					value: nextUID(prefix)
				});
			}

			return obj[uidKey];
		};
	}

	/**
	 * @memberOf Rift.object
	 *
	 * @param {Object} obj
	 * @param {Object} source
	 * @returns {Object}
	 */
	function mixin(obj, source) {
		var names = Object.getOwnPropertyNames(source);

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
