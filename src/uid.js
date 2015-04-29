(function() {

	var uidCounter = 0;

	/**
	 * Генерирует уникальный идентификатор.
	 *
	 * @function next
	 * @memberOf Rift.uid
	 *
	 * @example
	 * nextUID(); // '1'
	 * nextUID(); // '2'
	 * nextUID(); // '3'
	 *
	 * @param {string} [prefix='']
	 * @returns {string}
	 */
	function nextUID(prefix) {
		if (uidCounter == 2176782335) {
			uidCounter = 0;
		}

		return (prefix || '') + (++uidCounter).toString(36);
	}

	/**
	 * @namespace Rift.uid
	 */
	rt.uid = {
		next: nextUID
	};

})();
