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
		return (prefix === undef ? '' : prefix) + (++uidCounter);
	}

	/**
	 * @function resetCounter
	 * @memberOf Rift.uid
	 */
	function resetUIDCounter() {
		uidCounter = 0;
	}

	/**
	 * @namespace Rift.uid
	 */
	_.uid = {
		next: nextUID,
		resetCounter: resetUIDCounter
	};

})();
