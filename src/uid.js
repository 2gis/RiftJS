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
		if (uidCounter == 2176782335/* 'zzzzzz' */) {
			uidCounter = 0;
		}

		return (prefix || '') + (++uidCounter).toString(36);
	}

	rt.uid = {
		next: nextUID
	};
})();
