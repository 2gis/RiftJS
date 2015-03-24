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
				source = arguments[i];

				if (source == null) {
					throw new TypeError('Can\'t convert ' + source + ' to an object');
				}

				source = Object(source);

				var keys = Object.keys(source);

				for (var j = 0, m = keys.length; j < m; j++) {
					obj[keys[j]] = source[keys[j]];
				}
			}

			return obj;
		}
	});
}
