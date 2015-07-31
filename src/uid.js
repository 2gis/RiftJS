(function() {
	var uidCounter = 0;

	/**
	 * Генерирует уникальный идентификатор.
	 *
	 * @example
	 * nextUID(); // '1'
	 * nextUID(); // '2'
	 * nextUID('uid-'); // 'uid-3'
	 *
	 * @typesign (prefix: string = ''): string;
	 */
	function nextUID(prefix) {
		return (prefix || '') + (++uidCounter);
	}

	rt.uid = {
		next: nextUID
	};
})();
