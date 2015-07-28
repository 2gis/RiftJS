(function() {
	var nextUID = rt.uid.next;

	/**
	 * Получает уникальный идентификатор объекта.
	 * @typesign (obj: Object, prefix: string = ''): string;
	 */
	var getUID;

	if (typeof KEY_UID == 'symbol') {
		getUID = function getUID(obj, prefix) {
			return obj[KEY_UID] || (obj[KEY_UID] = nextUID(prefix));
		};
	} else {
		getUID = function getUID(obj, prefix) {
			if (!hasOwn.call(obj, KEY_UID)) {
				Object.defineProperty(obj, KEY_UID, {
					value: nextUID(prefix)
				});
			}

			return obj[KEY_UID];
		};
	}

	/**
	 * @typesign (obj: Object, source: Object): Object;
	 */
	var assign = Object.assign || function assign(obj, source) {
		var keys = Object.keys(source);

		for (var i = keys.length; i;) {
			obj[keys[--i]] = source[keys[i]];
		}

		return obj;
	};

	/**
	 * @typesign (obj: Object, source: Object): Object;
	 */
	function mixin(obj, source) {
		var names = Object.getOwnPropertyNames(source);

		for (var i = names.length; i;) {
			Object.defineProperty(obj, names[--i], Object.getOwnPropertyDescriptor(source, names[i]));
		}

		return obj;
	}

	rt.object = {
		getUID: getUID,
		assign: assign,
		mixin: mixin
	};
})();
