(function() {

	var reEscapableChars = /([?+|$(){}[^.\-\]\/\\*])/g;

	/**
	 * Экранирует спецсимволы регулярного выражения.
	 *
	 * @function escape
	 * @memberOf Rift.regex
	 *
	 * @example
	 * var re = 'Hello?!*`~World+()[]';
	 * re = new RegExp(escapeRegExp(re));
	 * console.log(re); // /Hello\?!\*`~World\+\(\)\[\]/
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	function escapeRegExp(str) {
		return str.replace(reEscapableChars, '\\$1');
	}

	/**
	 * Вызывает колбэк для каждого найденого в строке совпадения.
	 * Первым аргументом колбэк получает всё совпадение, остальными - запомненные подстроки.
	 *
	 * @function forEach
	 * @memberOf Rift.regex
	 *
	 * @example
	 * forEachMatch(/(\w+)\-(\d+)/g, 'a-1 b-2 c-3', function(match, name, value) {
	 *     console.log(name + '=' + value);
	 * });
	 * // a=1
	 * // b=2
	 * // c=3
	 *
	 * @param {RegExp} re - Регулярное выражение.
	 * @param {string} str - Строка, в которой будет происходить поиск совпадений.
	 * @param {Function} cb - Колбэк, который будет вызван для каждого найденного совпадения.
	 */
	function forEachMatch(re, str, cb) {
		if (re.global) {
			re.lastIndex = 0;

			for (var match; match = re.exec(str);) {
				if (cb.apply(global, match) === false) {
					break;
				}
			}
		} else {
			var match = re.exec(str);

			if (match) {
				cb.apply(global, match);
			}
		}
	}

	/**
	 * @namespace Rift.regex
	 */
	rt.regex = {
		escape: escapeRegExp,
		forEach: forEachMatch
	};

})();
