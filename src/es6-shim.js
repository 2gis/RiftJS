/*!
 * https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertySymbols
 */
if (!Object.getOwnPropertySymbols) {
	Object.getOwnPropertySymbols = function(obj) {
		return [];
	};
}

/*!
 * https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
if (!Object.assign) {
	Object.defineProperty(Object, 'assign', {
		configurable: true,
		writable: true,
		value: function(obj, source) {
			if (obj == null) {
				throw new TypeError('Can\'t convert ' + obj + ' to an object');
			}

			obj = Object(obj);

			for (var i = 1, l = arguments.length; i < l; i++) {
				var src = arguments[i];

				if (src == null) {
					throw new TypeError('Can\'t convert ' + src + ' to an object');
				}

				src = Object(src);

				var keys = Object.keys(src);

				for (var j = 0, m = keys.length; j < m; j++) {
					obj[keys[j]] = src[keys[j]];
				}

				var symbols = Object.getOwnPropertySymbols(src);

				for (var j = 0, m = symbols.length; j < m; j++) {
					obj[symbols[j]] = src[symbols[j]];
				}
			}

			return obj;
		}
	});
}
