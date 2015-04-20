(function() {

	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	var charCount = chars.length;
	var uidCounter = [];
	var uid = [];
	var uidLength = 0;

	/**
	 * Генерирует уникальный идентификатор.
	 *
	 * @function next
	 * @memberOf Rift.uid
	 *
	 * @example
	 * nextUID(); // '0'
	 * nextUID(); // '1'
	 * nextUID(); // '2'
	 *
	 * @param {string} [prefix='']
	 * @returns {string}
	 */
	function nextUID(prefix) {
		var i = uidLength;

		while (i) {
			var code = uidCounter[--i] + 1;

			if (code == charCount) {
				uidCounter[i] = 0;
				uid[i] = chars[0];
			} else {
				uidCounter[i] = code;
				uid[i] = chars[code];

				return (prefix || '') + uid.join('');
			}
		}

		uidCounter.unshift(0);
		uid.unshift(chars[0]);
		uidLength++;

		if (uidLength == 6) {
			uidCounter = [0];
			uid = [chars[0]];
			uidLength = 1;
		}

		return (prefix || '') + uid.join('');
	}

	/**
	 * @namespace Rift.uid
	 */
	rt.uid = {
		next: nextUID
	};

})();
