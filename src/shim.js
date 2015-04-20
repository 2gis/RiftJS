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
				var nextSource = arguments[i];

				if (nextSource == null) {
					throw new TypeError('Can\'t convert ' + nextSource + ' to an object');
				}

				nextSource = Object(nextSource);

				var keys = Object.keys(nextSource);

				for (var j = 0, m = keys.length; j < m; j++) {
					obj[keys[j]] = nextSource[keys[j]];
				}
			}

			return obj;
		}
	});
}
