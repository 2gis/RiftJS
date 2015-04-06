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
		var smbUID = Symbol('uid');

		getUID = function getUID(obj, prefix) {
			return obj[smbUID] || (obj[smbUID] = nextUID(prefix));
		};
	} else {
		var keyUID = '_rt-uid';

		getUID = function getUID(obj, prefix) {
			if (!hasOwn.call(obj, keyUID)) {
				Object.defineProperty(obj, keyUID, {
					value: nextUID(prefix)
				});
			}

			return obj[keyUID];
		};
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
		var names = skipDontEnum ? Object.keys(source) : Object.getOwnPropertyNames(source);

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
